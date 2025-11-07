import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateStatuteKeyword(userInput) {
  try {
    const prompt = `
You are an expert Pakistani legal query interpreter. Your task is to decide two things:

1. Whether the current query requires a **statutory law search** (e.g., Constitution, PPC, CrPC, Family Laws, Labour Laws, etc.).  
2. Extract a **concise, search-optimized keyword string** suitable for precise Meilisearch lookup of statutes or sections.  

Interpret user intent even with typos or informal language. Focus on precision, not verbosity.

---

Return **JSON only**:
{
  "search": true | false,
  "keyword": "..."
}

---
### Rules for "search"
- true → when the user’s intent requires **consulting or referencing a statute, section, article, code, or ordinance** — meaning the answer must come from written Pakistani law.
  Examples:
    - “punishment for theft”
    - “rights under Article 25A”
    - “procedure for bail under CrPC”
    - “define section 302 PPC”

- false → when the user’s intent is **general, theoretical, or conceptual**, even if legal in nature.  
  These include:
    - “what is law”
    - “why is justice important”
    - “branches of law”
    - “what is the constitution”
    - “difference between law and morality”
    - “importance of rule of law”
    - “what is crime”
    - “what is punishment”
  → For such queries, the user is **seeking general legal knowledge or philosophy**, not statute lookup.

- false → when the query asks about **cases, judgments, citations, or precedents**.
- false → when the query concerns **AI behavior, format, or metadata** rather than substance.
---

### Rules for "keyword"
- Extract the **most precise, single-word keyword** that directly matches the statutory concept.  
- If necessary, use **at most two words** (e.g., “Dower”, “Section 302”).  
- Prioritize **semantic and legal relevance** over length.  
- Do not include filler words like "law", "meaning", "definition", "explain", etc.  
- Normalize capitalization (“article” → “Article”, “ppc” → “Pakistan Penal Code”).  
- Ensure the keyword is **immediately searchable** for Meilisearch; avoid descriptive phrases.  
- Always return the **minimal possible string** that identifies the statute or section.  

---

### Examples

Input: "Explain section 302 of PPC"
Output: {"search": true, "keyword": "Section 302"}

Input: "What is the punishment for theft?"
Output: {"search": true, "keyword": "Theft"}

Input: "Procedure for appeal under CrPC"
Output: {"search": true, "keyword": "CrPC Appeal"}

Input: "Rights of citizens under Article 25A"
Output: {"search": true, "keyword": "Article 25A"}

Input: "Judgments related to khulla"
Output: {"search": false, "keyword": "Khulla"}

Input: "Find me cases about section 498"
Output: {"search": false, "keyword": "Section 498"}

Input: "Explain PLD 2000 FSC 1"
Output: {"search": false, "keyword": ""}

Input: "Give me definition of dower in Islam"
Output: {"search": true, "keyword": "Dower"}

---

### Prohibitions
- Do not include “cases”, “judgments”, “precedents”, “examples”, “references”.  
- Do not guess unrelated statutes.  
- Do not return empty keyword if a clear statutory concept is identifiable.  
- Return only clean, searchable, statute-focused keywords.

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
 STATUTE QUERY ANALYSIS
------------------------------------
Query:   ${userInput}
Search:  ${parsed.search}
Keyword: ${parsed.keyword}
====================================
`);

    return parsed;
  } catch (err) {
    console.error("AI statute keyword service error:", err.message);
    return { search: false, keyword: "" };
  }
}
