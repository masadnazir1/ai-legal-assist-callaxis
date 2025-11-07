import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSearchableKeyword(userInput) {
  try {
    const prompt = `
You are an expert Pakistani legal query interpreter. Your task is to decide two things:

1. Whether the current query requires a **case law search**.  
2. Extract a **concise, search-optimized keyword string** suitable for high-precision Meilisearch results.  

Do not correct spelling; interpret the intent even with typos. Focus on **precision, minimal noise, and legal relevance**.

---

Return **JSON only**:
{
  "search": true | false,
  "keyword": "..."
}

---

### Rules for "search"
- true → when the user directly or indirectly requests **case laws, judgments, citations, or precedents**.  
  Examples: "give me cases", "find judgments", "related to khulla", "relevant precedents", "case law for", "citations on", "examples of", "PLD", "SCMR", etc.
- false → when the user only asks **to explain, summarize, identify judges, extract ratio decidendi, procedural guidance**, or purely statutory/definition questions.
- false → if the query only concerns **output formatting** (e.g., clickable links, summary style).

---

### Rules for "keyword"
- Extract **core legal concept, statute, case reference, or judge name**.  
- Use **minimal, highly searchable words**, ideally **2–3 words**.  
- Prioritize proper nouns, statute numbers, or case identifiers.  
- Normalize variants to canonical form if possible (e.g., "syed mansoor" → "Syed Mansoor").  
- Remove generic words ("cases", "judgments", "references").  
- Only include words that will **produce highly relevant results** in a Meilisearch query.  
- If the query mentions multiple aspects, **prioritize the most specific legal entity or concept**.  

---

### Examples

Input: "Summarize PLD 2000 FSC 1 about Zakat and Ushr laws."  
Output: {"search": true, "keyword": "PLD 2000 FSC 1"}

Input: "mention the judges and lawyers name in the above PLD"  
Output: {"search": false, "keyword": ""}

Input: "cases on Article 199"  
Output: {"search": true, "keyword": "Article 199 Constitution of Pakistan"}

Input: "explain ratio decidendi of the previous case"  
Output: {"search": false, "keyword": ""}

Input: "can you find the exact case with id 3837"  
Output: {"search": true, "keyword": "3837"}

Input: "Who were the judges in PLD 2010 Federal Shariat Court 1"  
Output: {"search": true, "keyword": "PLD 2010 Federal Shariat"}

Input: "give me some cases where syed Mansoor was judge"  
Output: {"search": true, "keyword": "Syed Mansoor"}

Input: "give me caselaws related to khulla and talaq"  
Output: {"search": true, "keyword": "Khulla Talaq"}
Input: "give me clickable link for cases upto 5 for khulla and talaq"  
Output: {"search": true, "keyword": "Khulla Talaq"}

---

### Prohibitions
- Never return generic placeholders like "cases", "case laws", "judgments", "and", "or", or "references".  
- Keyword must always be **specific, actionable, and optimized** for search.  
- If the query is only about formatting or output style, return:  
  {"search": false, "keyword": ""}  

---

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
