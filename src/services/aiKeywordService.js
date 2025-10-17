/**
 * generateSearchableKeyword
 * -------------------------
 * Uses OpenAI to extract precise legal keywords or citations from a user query
 * that can be used to search a legal case database like MeiliSearch.
 *
 * Features:
 * - Converts natural language queries into search-optimized keywords.
 * - Handles case names, citations (e.g., "PLD 2010 Federal Shariat Court 1"),
 *   and legal topics (e.g., "doctrine of necessity").
 * - Returns a concise, relevant keyword string suitable for database search.
 *
 * @param {string} userInput - The user's raw search query or question.
 *
 * @returns {Promise<string | undefined>}
 *   - Returns the refined keyword string.
 *   - If AI service fails or no keywords are generated, returns undefined.
 *
 * @example
 * const keyword = await generateSearchableKeyword("Doctrine of necessity in Pakistani law");
 * console.log(keyword); // Output: "necessity" or "doctrine of necessity"
 *
 * @throws {Error} Logs AI errors internally. No error is thrown to the caller,
 *                 function may return undefined on failure.
 */

import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- AI-ENHANCED KEYWORD SERVICE ---
export async function generateSearchableKeyword(userInput) {
  try {
    // AI prompt for refinement
    const prompt = `
You are a legal keyword extraction assistant specialized in Pakistani case law.
Given a user query, return the most accurate search-ready keyword or case name
that can be used to find relevant case laws in a database like MeiliSearch.

Rules:
- If a case name like "State vs Zia-ur-Rehman" is mentioned, return exactly that example ='State vs Zia-ur-Rehman'.
- If a citation like "PLD 2010 Federal Shariat Court 1" appears, return it exactly so it should be retunres as ='PLD 2010 Federal' or 'PLD 2010'.
- If it's a topic (e.g. doctrine of necessity, article 9), return the precise legal term. it sould be someting like 'necessity or doctrine or  article 9'
- Do NOT include filler or extra words — only keywords that improve search relevance.

User query: """${userInput}"""


Return only the refined keyword string, nothing else.


`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You extract precise legal keywords for search.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 50,
    });

    const refined = completion.choices?.[0]?.message?.content?.trim();

    //
    console.log("refined", refined);
    return refined;
  } catch (err) {
    console.error("AI keyword service error:", err.message);
    // fallback to rule-based
  }
}
