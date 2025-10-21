/**
 * generateSearchableKeyword
 * -------------------------
 * Uses OpenAI to extract search-optimized legal keywords or citations
 * and determine if case law search is required.
 */

import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSearchableKeyword(userInput) {
  try {
    const prompt = `
You are an expert Pakistani legal query interpreter.
Your task: 
1. Decide if the user's query requires case law search (true/false).
2. Extract one concise, search-optimized legal keyword string.

Return output **only** in JSON with the exact structure:
{
  "search": true | false,
  "keyword": "..."
}

Rules for "search":
- true if the query asks for precedents, judgments, PLD, SCMR, cases, or court rulings.
- false if it only asks for general explanations, definitions, or statutes.

Rules for "keyword":
- Use legal citations, case titles, statutory references, or normalized doctrines.
- No explanations or filler.
- Always be specific but concise.

Examples:
Input: "what is doctrine of necessity in Pakistan"
Output: {"search": true, "keyword": "doctrine of necessity"}

Input: "define contract under Contract Act"
Output: {"search": false, "keyword": "Contract Act 1872"}

Input: "cases on Article 199"
Output: {"search": true, "keyword": "Article 199 Constitution of Pakistan"}

Input: "PLD 2020 SC 12"
Output: {"search": true, "keyword": "PLD 2020 SC"}

Now process this query:
"""${userInput}"""
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a strict JSON-only responder for Pakistani legal queries. Never output text outside JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 50,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();

    // Safe parse
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { search: false, keyword: raw || "" };
    }

    console.log(`
====================================
⚖️  LEGAL QUERY ANALYSIS
------------------------------------
Query:   ${userInput}
Search:  ${parsed.search}
Keyword: ${parsed.keyword}
====================================
`);

    return parsed;
  } catch (err) {
    console.error("AI keyword service error:", err.message);
    return { search: false, keyword: "" };
  }
}
