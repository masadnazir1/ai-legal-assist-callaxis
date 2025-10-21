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

const activeControllers = {};

// Stream AI response via Express
export const generateAIResponse = async (
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

  try {
    const prompt = `
You are a professional Pakistani legal assistant specializing in caselaws and statutory interpretation.

Behavior rules:
- For greetings or polite small talk, respond naturally and courteously. Do not mention laws or cases.
- For legal questions, provide a structured, clear, and human-readable answer. 
- Maintain a calm, respectful, and informative tone — like a senior associate explaining the law to a client.
- Avoid robotic brevity. Explain key legal points in 2–3 descriptive sentences before citing any precedent.
- Cite caselaws **only when directly relevant** to the reasoning, not merely because they appear in the database.
- If none of the provided caselaws are meaningfully related, rely on general statutory interpretation.

All responses must follow these formatting rules:
- Use enhanced advanced **Markdown** formatting only.
- Use clear headings (## for section titles).
- Bold all key terms, legal principles, statutes, and citations.
- Use bullet points for multi-part tests or principles.
- Use Markdown blockquotes (>) for direct quotations.
- Wrap case citations or statutory references in backticks.
- Never output plain text or code fences unless for literal citations.

Caselaw Handling:
- Treat the first 1–3 candidate caselaws as authoritative.
- Extract facts, legal principles, and rulings relevant to the query.
- Cite only caselaws that directly support your reasoning.
- Summarize each relevant caselaw in 1–3 sentences.
- Use case names, citations, or identifiers exactly as provided, wrapped in backticks.
- If no caselaws are relevant, rely solely on statutory interpretation.
- Never fabricate rulings, case names, or citations.


Prohibitions:
- Never output plain text — **all content must be Markdown formatted**.  
- Never insert conversational tone in legal reasoning.  
- Never cite irrelevant or tangential cases.  
- Never wrap full responses in code fences unless the output must be displayed **literally**.  
- Never present “AI explanations” or self-reference — act as a **human legal expert**.


User question:
"${userQuery}"

${
  caselaws?.length
    ? `Candidate caselaws:\n${caselaws
        .slice(0, 3)
        .map((c, i) =>
          c.case_discription_plain
            ? `**Case ${i + 1}:** ${c.case_discription_plain}`
            : null
        )
        .filter(Boolean)
        .join("\n\n")}`
    : "No caselaws found, rely on general legal understanding."
}

Attachment Policy:

- Do not attach related case IDs if they are not fully relevant to the user query or response, unless the user explicitly requests all related cases.
- **Relevance Rule:** Append the "related cases" block only if:
  1. The model’s reasoning explicitly cites or draws from at least one of the listed caselaws.
  2. The semantic similarity score between the user query and case content exceeds 0.85 (via embeddings or keyword overlap).

- Limit the number of attached cases to 3–5 for clarity and efficiency.
- Ensure related cases are meaningfully referenced to avoid clutter or misleading suggestions.

Formatting:
- If the relevance rule is met, append at the end:

Here are **${
      caseIds.length
    }** more **relevant precedents** identified for contextual reference:

${
  caseIds &&
  caseIds
    .map(
      (id, i) =>
        `**${
          i + 1
        }.** [Case Reference – ${id}](https://ai.pakistanlawhelp.com/my-account/case-laws.php?filter_related=${id})`
    )
    .join("\n")
}

`;

    // Detect client disconnect

    res.on("close", () => {
      if (activeControllers[streamId]) {
        controller.abort();
        delete activeControllers[streamId];
        console.log("Client disconnected, stream aborted:", streamId);
      }
    });

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
      max_tokens: 1600,
      stream: true,
      // signal: controller.signal,
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

    console.log("Stream aborted:", streamId);
    // End stream
    res.write(`data: [DONE]\n\n`);
    res.end();

    logger.info("Stream completed successfully");
    return;
  } catch (error) {
    if (error.name === "AbortError") console.log("Stream aborted:", streamId);

    logger.error("OpenAI Stream Error:", error.message);
    if (res && !res.headersSent) {
      res.write(`data: Error: ${error.message}\n\n`);
      res.end();
    }
    throw new Error("Failed to stream AI response");
  } finally {
    delete activeControllers[streamId];
  }
};

export function abortStream(req, res) {
  const { id } = req.body;
  const controller = activeControllers[id];
  if (!controller) return res.status(404).json({ success: false });
  controller.abort();
  delete activeControllers[id];
  res.json({ success: true });
}
