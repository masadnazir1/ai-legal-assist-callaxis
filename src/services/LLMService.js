import OpenAI from "openai";
import crypto from "crypto";
import dotenv from "dotenv";
import { logger } from "../Utils/logger.js";
import { proviedPrompt } from "../Utils/prompts.js";
import { isFollowUp } from "../Utils/isFollowUp.js";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const activeControllers = {};
const chatSessions = new Map(); // { userId: { history: [], context: {}, lastUsed: timestamp } }

// Cleanup old sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  const EXPIRATION = 2 * 60 * 60 * 1000; // 2 hours
  for (const [userId, session] of chatSessions.entries()) {
    if (now - session.lastUsed > EXPIRATION) {
      chatSessions.delete(userId);
      logger.info(`Deleted inactive chat session for user: ${userId}`);
    }
  }
}, 10 * 60 * 1000);

export const generateAIResponse = async (
  userId,
  userQuery,
  caselaws = [],
  statutes = [],
  res = null
) => {
  caselaws = Array.isArray(caselaws) ? caselaws : [];
  statutes = Array.isArray(statutes) ? statutes : [];

  const streamId = crypto.randomUUID();
  const controller = new AbortController();
  activeControllers[streamId] = controller;

  if (res) res.setHeader("X-Stream-ID", streamId);

  const extractEntries = (arr, key, limit = 5) =>
    arr.slice(0, limit).map((item) => ({
      case_id: item.id,
      case_title:
        typeof item[key] === "string"
          ? item[key]
              .trim()
              .split("\n")[0]
              .substring(0, 350)
              .replace(/\s+/g, " ")
          : "",
    }));

  const caseEntries = extractEntries(caselaws, "case_discription_plain");
  const statuteEntries = extractEntries(statutes, "detail_plain");

  const caseTexts = caselaws
    .slice(0, 5)
    .map((c) => c.case_discription_plain?.split("\n")[0] || "");
  const statuteTexts = statutes
    .slice(0, 5)
    .map((s) => s.detail_plain?.split("\n")[0] || "");

  // Chat history management
  const session = chatSessions.get(userId) || {
    history: [],
    context: {},
    lastUsed: Date.now(),
  };
  session.lastUsed = Date.now();
  const history = session.history;

  const saveHistory = (userId, historyArr, context) => {
    if (historyArr.length > 20) historyArr.splice(0, historyArr.length - 20);
    chatSessions.set(userId, {
      history: historyArr,
      context,
      lastUsed: Date.now(),
    });
  };

  const FollowUp = await isFollowUp(
    session.context?.lastUserQuery,
    session.context?.lastResponseSummary,
    userQuery
  );
  console.log("followup true or false", FollowUp, session.context);

  // Prepend previous context if follow-up
  let contextInjection = "";
  if (FollowUp) {
    console.log("isFollowUp", FollowUp);
    contextInjection = `
Reference Context:
- Previous Topic: ${session.context.lastEntity}
- Previous Response Summary: ${session.context.lastResponseSummary}
- Previously cited statutes: ${
      session.context.lastStatutes?.join(", ") || "None"
    }
- Previously cited caselaws: ${
      session.context.lastCaselaws?.join(", ") || "None"
    }

New Query:
"${userQuery}"

Instruction:
- Continue from the previous context.
- Provide procedural or conceptual answer consistent with previous intent.
`;
  }

  try {
    const prompt = await proviedPrompt(
      contextInjection || userQuery,
      caselaws,
      caselaws.map((c) => c.id),
      caseEntries,
      statuteTexts,
      statuteEntries
    );

    if (res) {
      res.on("close", () => {
        if (activeControllers[streamId]) {
          controller.abort();
          delete activeControllers[streamId];
          logger.info(`Client disconnected, stream aborted: ${streamId}`);
        }
      });
    }

    const messages = [
      {
        role: "system",
        content:
          "You are a professional Pakistani legal assistant. Respond only with factual and case-supported legal explanations.",
      },
      ...history,
      { role: "user", content: prompt },
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.4,
      max_tokens: 1600,
      stream: !!res,
    });

    let fullText = "";

    if (!res) {
      for await (const chunk of stream ?? []) {
        fullText += chunk.choices?.[0]?.delta?.content || "";
      }
    } else {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      for await (const chunk of stream ?? []) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (!content) continue;
        fullText += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }

      res.write(`data: [DONE]\n\n`);
      res.end();
    }

    // Update history and context
    const detectedEntity = contextInjection
      ? session.context.lastEntity
      : userQuery.split(" ")[0]; // crude placeholder
    const detectedIntent = "legal"; // could enhance with NLP classifier
    const selectedStatutes = statuteTexts.slice(0, 3);
    const selectedCaselaws = caseTexts.slice(0, 3);

    session.history.push({ role: "user", content: prompt });
    session.history.push({ role: "assistant", content: fullText.trim() });
    const context = {
      lastEntity: detectedEntity,
      lastIntent: detectedIntent,
      lastStatutes: selectedStatutes,
      lastCaselaws: selectedCaselaws,
      lastResponseSummary: fullText.trim().split(".").slice(0, 5).join("."),
      lastUserQuery: userQuery,
    };
    saveHistory(userId, session.history, context);

    if (!res) return { summary: fullText.trim(), related: caseTexts };
    logger.info(`Stream completed successfully for user: ${userId}`);
  } catch (error) {
    if (error.status === 429 || error.code === "insufficient_quota") {
      logger.error("OpenAI quota exceeded");
      if (res && !res.headersSent) {
        res.write(
          `data: ${JSON.stringify({ error: "OpenAI quota exceeded" })}\n\n`
        );
        res.write(`data: [DONE]\n\n`);
        res.end();
      }
      return;
    }

    if (error.name === "AbortError") {
      logger.warn(`Stream aborted: ${streamId}`);
      return;
    }

    logger.error("OpenAI Stream Error:", error.message);
    if (res && !res.headersSent) {
      res.write(
        `data: ${JSON.stringify({
          error: error.message || "Failed to stream AI response",
        })}\n\n`
      );
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  } finally {
    delete activeControllers[streamId];
  }
};
