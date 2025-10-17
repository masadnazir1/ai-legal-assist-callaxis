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

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Stream AI response via Express
export const generateAIResponse = async (
  userQuery,
  caselaws = [],
  res = null
) => {
  //

  // Take the first 5 case lines
  const caseIds = caselaws.slice(0, 5).map((c) => c.id);

  if (!caselaws || caselaws.length === 0) {
    logger.warn("No caselaws provided to AI service");
  }

  try {
    const prompt = `
You are a professional Pakistani legal assistant specializing in caselaws and statutory interpretation.

Behavior rules:
- If the user's message is a greeting, small talk, or polite conversation (e.g., "hello", "hi", "good morning", "how are you", "thank you"), respond naturally and politely **without** giving legal information or mentioning any cases.
- If the message is a legal question or statement, answer it accurately, concisely, and factually.
- Use the provided caselaws **only if they are relevant**. Do not force a connection.
- When citing caselaws, mention the case title or citation when possible.

User question:
"${userQuery}"

${
  caselaws[0]?.case_discription_plain
    ? `Relevant caselaws:\n${caselaws[0].case_discription_plain}`
    : "No caselaws found, answer with general legal knowledge."
}



If and only if the user's query is legal **and** at least 80% semantically related to the listed caselaws, append this block at the end of your response:

Here are ${caseIds.length} more related cases. Just click one of them to view:
${caseIds
  .map(
    (id, i) =>
      `${
        i + 1
      }. [Case ID: ${id}](https://ai.pakistanlawhelp.com/my-account/case-laws.php?filter_related=${id})`
  )
  .join("\n")}
`;

    // Stream completion
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional Pakistani legal assistant. Respond only with factual and case-supported legal explanations.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 800,
      stream: true,
    });

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

    console.log("AND THE fullText", fullText);
    logger.info("Stream completed successfully");
    return;
  } catch (error) {
    logger.error("OpenAI Stream Error:", error.message);
    if (res && !res.headersSent) {
      res.write(`data: Error: ${error.message}\n\n`);
      res.end();
    }
    throw new Error("Failed to stream AI response");
  }
};
