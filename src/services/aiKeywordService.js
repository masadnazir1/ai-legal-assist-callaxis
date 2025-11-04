import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSearchableKeyword(userInput) {
  try {
    const prompt = `
You are an expert Pakistani legal query interpreter. Decide two things: 
1. Whether the current query requires **case law search**. 
2. Extract a concise, search-optimized legal keyword string. 
Do not check or correct the user's spelling; interpret the intent accurately even if the query contains typos or misspellings.


Return JSON only:
{
  "search": true | false,
  "keyword": "..."
}

Rules for "search":
- true → when the user directly or indirectly requests **case laws, judgments, citations, or precedents**.  
  Examples: "give me cases", "show references", "find judgments", "related to khulla", "relevant precedents", "case law for", "citations on", "examples of", etc.
- false → when the user only asks **to explain, summarize, identify judges, ratio decidendi, or discuss the previous case**.
- false → for pure statutory or definitional explanations without any case-finding intent.


Rules for "keyword":
- Extract or normalize the *core legal concept* or *case reference*.
- Use minimal, search-efficient phrase (e.g. "Khulla cases", "Article 199 Constitution", "Maintenance Family Law", etc.)
- Never echo full user input or unnecessary words.

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

Input: "give me caselaws , give me pld related to x case or related to x family matter eg khulla"
Output: {"search": true, "keyword": "PLD x year x related keyword"}


Prohibitions:
- **Never output generic keywords** like "cases", "case laws", "judgments", "references", or "precedents" — these cause irrelevant searches.  
- For example, if the query is:
  "give me some cases related to khulla and talaq links clickable and don't add any summary or explanation just links"
  →  Do NOT return "cases", "case laws", or "family cases".
  →  Instead, return a precise composite keyword such as "Khulla and Talaq Family Law".
- If the user’s request is **only for clickable links or output format** (no actual case search intent),
  then set:
  "search": false,
  "keyword": ""
- The "keyword" must always represent a specific legal doctrine, article, or identifiable issue — never a placeholder term.


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
