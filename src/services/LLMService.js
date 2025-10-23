/**
 * generateAIResponse
 * ------------------
 * Generates a case-supported legal answer to a user query using OpenAI's GPT-4o-mini model.
 * Can stream the response directly to an Express.js client via Server-Sent Events (SSE)
 * or return the full response as a string.
 *
 * Features:
 * - Uses the first 5 lines of the provided caselaws as context.
 * - Appends a prompt for the AI to cite cases and ask the user about more related cases.
 * - Supports both streaming (SSE) and non-streaming response modes.
 *
 * @param {string} userQuery - The legal question or query from the user.
 * @param {Array<Object>} caselaws - Array of case objects. Each object should have a `case_discription_plain` field.
 * @param {import("express").Response} [res=null] - Optional Express.js response object. If provided, enables streaming the AI response.
 *
 * @returns {Promise<Object|void>}
 * - If `res` is not provided: Returns a Promise resolving to an object:
 *   { summary: string, related: string[] }.
 *   - `summary`: The AI-generated answer as a string.
 *   - `related`: Array of first lines from provided caselaws.
 * - If `res` is provided: Streams the response via SSE and returns nothing.
 *
 * @example
 * // Non-streaming usage
 * const result = await generateAIResponse("Explain doctrine of necessity", caselawsArray);
 * console.log(result.summary, result.related);
 *
 * @example
 * // Streaming usage in Express
 * app.post("/search", async (req, res) => {
 *   await generateAIResponse(req.body.query, caselawsArray, res);
 * });
 *
 * @throws {Error} Throws if OpenAI service fails or streaming fails.
 */

import OpenAI from "openai";
import { logger } from "../Utils/logger.js";
import dotenv from "dotenv";
import { proviedPrompt } from "../Utils/prompts.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const activeControllers = {};

//memory store to save the user histroy for contextual streaming
const chatSessions = new Map(); // { userId: [ { role, content }, ... ] }

// Stream AI response via Express
export const generateAIResponse = async (
  userId,
  userQuery,
  caselaws = [],
  res = null
) => {
  const streamId = crypto.randomUUID();
  const controller = new AbortController();
  activeControllers[streamId] = controller;

  //
  if (res) res.setHeader("X-Stream-ID", streamId);
  //
  let caseIds = [];

  if (Array.isArray(caselaws) && caselaws.length > 0) {
    caseIds = caselaws.slice(0, 5).map((c) => c.id);
  } else {
    logger.warn("No caselaws provided to AI service");
  }

  //
  let caseTexts = [];
  if (Array.isArray(caselaws) && caselaws.length > 0) {
    caseTexts = caselaws
      .slice(0, 5)
      .map((c) => c.case_discription_plain.split("\n")[0]);
  }

  //some functions to handle the features

  function getChatHistory(userId) {
    if (!chatSessions.has(userId)) chatSessions.set(userId, []);
    return chatSessions.get(userId);
  }

  function saveChatHistory(userId, history) {
    if (history.length > 20) history.splice(0, history.length - 20);
    chatSessions.set(userId, history);
  }

  const history = getChatHistory(userId);

  try {
    let prompt = await proviedPrompt(userQuery, caselaws, caseIds);

    // Detect client disconnect
    res.on("close", () => {
      if (activeControllers[streamId]) {
        controller.abort();
        delete activeControllers[streamId];
        console.log("Client disconnected, stream aborted:", streamId);
      }
    });

    const messages = [
      {
        role: "system",
        content:
          "You are a professional Pakistani legal assistant. Respond only with factual and case-supported legal explanations.",
      },
      ...history,
      { role: "user", content: prompt },
    ];

    // Stream completion
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.4,
      max_tokens: 1600,
      stream: true,
    });

    // Non-streaming
    if (!res) {
      // If not streaming via Express, return as string
      let fullText = "";
      for await (const chunk of stream) {
        fullText += chunk.choices?.[0]?.delta?.content || "";
      }
      return { summary: fullText.trim(), related: caseTexts };
    }

    // Setup SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    let fullText = "";

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content || "";
      if (!content) continue;

      fullText += content;

      // Escape newlines for SSE safety, send JSON per chunk
      const payload = JSON.stringify({ content });
      res.write(`data: ${payload}\n\n`);
    }

    // End stream
    res.write(`data: [DONE]\n\n`);
    res.end();

    const assistantReply = fullText.trim();

    // Store conversation for context
    history.push({ role: "user", content: prompt });
    history.push({ role: "assistant", content: assistantReply });
    saveChatHistory(userId, history);

    logger.info(`Stream completed successfully for user: ${userId}`);
    return;
  } catch (error) {
    if (error.name === "AbortError") console.log("Stream aborted:", streamId);

    logger.error("OpenAI Stream Error:", error.message);
    if (res && !res.headersSent) {
      res.write(`data: Error: ${error.message}\n\n`);
      res.end();
    }
    throw new Error("Failed to stream AI response", error);
  } finally {
    delete activeControllers[streamId];
  }
};
