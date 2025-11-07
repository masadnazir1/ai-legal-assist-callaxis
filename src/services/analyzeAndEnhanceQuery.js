import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeAndEnhanceQuery(userInput) {
  try {
    const prompt = `
You are an expert Pakistani legal query assistant. For the following user query:

"""${userInput}"""

Do two things:

1. **Classify** the query into one of four categories:
   - "statute" → requires consulting Pakistani statutory law (e.g., PPC, CrPC, Constitution, Family Laws)
   - "caselaw" → requires referencing court judgments or precedents
   - "both" → requires consulting both statutory provisions and relevant case law
   - "none" → general legal knowledge, definitions, or conceptual queries

2. **Enhance** the user query for optimal LLM response:
   - Correct typos and grammatical errors
   - Clarify context and legal domain
   - Maintain original intent
   - If possible, add statute/caselaw references inline for clarity

Return **JSON only**:

{
  "search_type": "statute" | "caselaw" | "both" | "none",
  "enhanced_query": "..."
}

Examples:

Input: "explain sec 302 ppc"
Output: {"search_type":"statute","enhanced_query":"Explain Section 302 Pakistan Penal Code"}

Input: "10 cases on breach of contract by govt"
Output: {"search_type":"caselaw","enhanced_query":"Provide 10 cases on breach of contract by the government"}

Input: "Explain section 302 PPC with related cases"
Output: {"search_type":"both","enhanced_query":"Explain Section 302 Pakistan Penal Code and provide related cases"}

Input: "what is law"
Output: {"search_type":"none","enhanced_query":"What is the concept of law and its purpose in Pakistan?"}

Now process the user query above.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Respond strictly in JSON with 'search_type' and 'enhanced_query' only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 120,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { search_type: "none", enhanced_query: userInput };
    }

    console.log(`
====================================
 QUERY ANALYSIS & ENHANCEMENT
------------------------------------
Original Query:  ${userInput}
Search Type:     ${parsed.search_type}
Enhanced Query:  ${parsed.enhanced_query}
====================================
`);

    return parsed;
  } catch (err) {
    console.error("Query enhancement service error:", err.message);
    return { search_type: "none", enhanced_query: userInput };
  }
}
