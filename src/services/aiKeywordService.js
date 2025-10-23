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
Decide two things:
1. Whether the current query requires **case law search**.
2. Extract a concise, search-optimized legal keyword string.

Return JSON only:
{
  "search": true | false,
  "keyword": "..."
}

Rules for "search":
- true → when the user **directly requests case laws, judgments, citations, or precedents** (mentions like PLD, SCMR, YLR, etc.)
- false → when the user is **asking a follow-up question** about a previously mentioned case (e.g., "who were the judges", "what was the ratio", "explain above case", "continue previous one").
- false → for general explanations, definitions, or statutory interpretation without case references.

Rules for "keyword":
- Use concise legal citation or normalized doctrine if applicable.
- Otherwise return minimal clean phrase summarizing legal intent.
- Never repeat full query text.

Examples:
Input: "Summarize PLD 2000 FSC 1 about Zakat and Ushr laws."
Output: {"search": true, "keyword": "PLD 2000 FSC 1"}

Input: "mention the judges and lawyers name in the above PLD"
Output: {"search": false, "keyword": ""}

Input: "cases on Article 199"
Output: {"search": true, "keyword": "Article 199 Constitution of Pakistan"}

Input: "explain ratio decidendi of the previous case"
Output: {"search": false, "keyword": ""}

Input: "can you find the exact case withe id and make summery for me Case Reference – 3837"
Output: {"search": true, "keyword": "3837"}

Input: "Who were the judges in PLD 2010 Federal Shariat Court 1"
Output: {"search": true, "keyword": "PLD 2010 Federal Shariat"}



Now process:
"""${userInput}"""
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Respond strictly in JSON with 'search' and 'keyword' keys only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 60,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { search: false, keyword: "" };
    }

    // additional safeguard — no PLD in input => never search
    if (!/\b(PLD|SCMR|YLR|MLD|CLC|PCR|PCrLJ)\b/i.test(userInput)) {
      parsed.search = false;
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
