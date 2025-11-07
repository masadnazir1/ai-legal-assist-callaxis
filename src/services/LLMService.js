/**
 * generateAIResponse
 * ------------------
 * Generates a case-supported legal answer to a user query using OpenAI's GPT-4o-mini model.
 * Can stream the response directly to an Express.js client via SSE or return the full response as a string.
 *
 * Features:
 * - Uses the first few lines of the provided caselaws/statutes as context.
 * - Supports both streaming (SSE) and non-streaming modes.
 * - Maintains per-user chat history for contextual responses.
 * - Handles client disconnects, network issues, and OpenAI quota errors gracefully.
 *
 * @param {string} userId - Unique identifier for the user/session.
 * @param {string} userQuery - The legal question or query from the user.
 * @param {Array<Object>} caselaws - Array of case objects. Each object should have a `case_discription_plain` field.
 * @param {Array<Object>} statutes - Array of statute objects. Each object should have a `detail_plain` field.
 * @param {import("express").Response} [res=null] - Optional Express response object for streaming.
 *
 * @returns {Promise<Object|void>}
 * - If `res` is not provided: resolves to { summary: string, related: string[] }.
 * - If `res` is provided: streams response via SSE and returns nothing.
 */

import OpenAI from "openai";
import crypto from "crypto";
import dotenv from "dotenv";
import { logger } from "../Utils/logger.js";
import { proviedPrompt } from "../Utils/prompts.js";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const activeControllers = {};
const chatSessions = new Map(); // { userId: { history: [], lastUsed: timestamp } }

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
  // Ensure arrays
  caselaws = Array.isArray(caselaws) ? caselaws : [];
  statutes = Array.isArray(statutes) ? statutes : [];

  const streamId = crypto.randomUUID();
  const controller = new AbortController();
  activeControllers[streamId] = controller;

  if (res) res.setHeader("X-Stream-ID", streamId);

  // Helper to extract entries for AI context
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
    lastUsed: Date.now(),
  };
  session.lastUsed = Date.now();
  const history = session.history;

  const saveHistory = (userId, historyArr) => {
    if (historyArr.length > 20) historyArr.splice(0, historyArr.length - 20);
    chatSessions.set(userId, { history: historyArr, lastUsed: Date.now() });
  };

  try {
    const prompt = await proviedPrompt(
      userQuery,
      caselaws,
      caselaws.map((c) => c.id),
      caseEntries,
      statuteTexts,
      statuteEntries
    );

    // Handle client disconnect
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

    // Stream or non-stream
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.4,
      max_tokens: 1600,
      stream: !!res,
    });

    // Non-stream mode
    if (!res) {
      let fullText = "";
      for await (const chunk of stream ?? []) {
        fullText += chunk.choices?.[0]?.delta?.content || "";
      }
      return { summary: fullText.trim(), related: caseTexts };
    }

    // SSE streaming mode
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    let fullText = "";

    for await (const chunk of stream ?? []) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (!content) continue;

      fullText += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();

    // Save session history
    history.push({ role: "user", content: prompt });
    history.push({ role: "assistant", content: fullText.trim() });
    saveHistory(userId, history);

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
