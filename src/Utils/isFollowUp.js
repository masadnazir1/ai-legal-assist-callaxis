import OpenAI from "openai";

import dotenv from "dotenv";
dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Detect if current query is a follow-up to previous query
 * @param {string} prevQuery
 * @param {string} currentQuery
 * @returns {Promise<boolean>}
 */
export const isFollowUp = async (prevQuery, prevResponse, currentQuery) => {
  if (!prevQuery || !currentQuery) return false;

  console.log("LLM followup check", prevQuery, currentQuery);
  const prompt = `
You are a professional Pakistani legal assistant. Determine if the second user query
is a follow-up to the previous query, considering the legal context and the assistant's previous response.

- Consider it a follow-up if it pertains to the same legal topic, case type, statute, or procedure,
  even if phrasing or words are different.
- Use the previous assistant response to understand context, but do not infer beyond the topic.
- Check if the current user query is asking something based on the previous assistant response, 
  seeking clarification, further explanation, or continuation.
- Consider follow-up even if the user uses different words or asks for procedural details related to the previous response.

Previous assistant response: "${prevResponse}"
Previous user query: "${prevQuery}"
Current user query: "${currentQuery}"

Respond strictly with only "true" or "false" — no explanations, punctuation, or extra text.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 20, // increased to avoid truncation
    });

    let text = response.choices?.[0]?.message?.content ?? "";
    text = text.replace(/[^a-z]/gi, "").toLowerCase(); // normalize

    return text === "true";
  } catch (err) {
    console.error("isFollowUp error:", err);
    return false;
  }
};
