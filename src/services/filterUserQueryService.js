import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CONFIG = {
  domain: "Pakistani legal AI assistant",
  model: "gpt-4o-mini",
  temperature: 0.2,
  maxTokens: 120,

  categories: {
    LEGAL:
      "Mentions, implies, or requests anything related to law, judiciary, rights, constitution, legislation, judgments, legal documents, family law (marriage, divorce, khulla, maintenance), contracts, or case references (e.g., PLD, SCMR, citations).",
    GREETING:
      "Common greeting, polite phrase, or acknowledgment (e.g., hi, hello, salam, thanks, ok).",
    ABUSIVE: "Contains hate, slurs, harassment, or obscene language.",
    HARMFUL: "Mentions self-harm, suicide, or violence.",
    NON_LEGAL: "Unrelated to law or judiciary.",
  },

  defaultReasons: {
    LEGAL: "I'm here to assist with legal questions and Pakistani caselaws.",
    GREETING: "Hello! How can I assist you with your legal question?",
    ABUSIVE: "I can't respond to abusive or disrespectful language.",
    HARMFUL: "If you’re in distress, please seek immediate professional help.",
    NON_LEGAL: "I'm here to assist only with legal matters.",
  },
};

/**
 * Builds the classification prompt.
 */
function buildPrompt(userInput) {
  return `
You are a classification system for a ${CONFIG.domain}.

Task:
Classify the user's message strictly into one of these categories: LEGAL, GREETING, ABUSIVE, HARMFUL, NON_LEGAL.

Guidelines:
- Always infer intent from meaning, not grammar.
- If the message even indirectly mentions, implies, or refers to Pakistani legal, judicial, family, or constitutional topics (like marriage, divorce, khulla, maintenance, rights, FIR, contracts, etc.), classify as LEGAL.
- Do NOT classify educational or explanatory legal queries as NON_LEGAL.
- Only classify as NON_LEGAL if the message clearly has no connection to law, rights, or justice.

Output JSON only in this format:
{
  "category": "LEGAL" | "GREETING" | "ABUSIVE" | "HARMFUL" | "NON_LEGAL",
  "reason": "Short human explanation suitable to show to user."
}

User message:
"""${userInput}"""
`;
}

/**
 * Filter function — always returns structured, consistent output.
 */
export async function filterUserQuery(userInput) {
  try {
    const prompt = buildPrompt(userInput);

    const completion = await openai.chat.completions.create({
      model: CONFIG.model,
      messages: [
        {
          role: "system",
          content:
            "Classify the message based on implicit or explicit legal relevance.",
        },
        { role: "user", content: prompt },
      ],
      temperature: CONFIG.temperature,
      max_tokens: CONFIG.maxTokens,
    });

    let raw = completion.choices?.[0]?.message?.content?.trim() || "";
    if (!raw.startsWith("{")) raw = raw.slice(raw.indexOf("{")); // repair stray text if needed

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      // Defensive fallback — assume LEGAL if uncertain
      result = { category: "LEGAL", reason: CONFIG.defaultReasons.LEGAL };
    }

    // Defensive defaults
    const category = result.category || "LEGAL";
    const reason =
      result.reason?.trim() ||
      CONFIG.defaultReasons[category] ||
      CONFIG.defaultReasons.LEGAL;

    return {
      allowed: ["LEGAL", "GREETING"].includes(category),
      category,
      reason,
    };
  } catch (err) {
    console.error("Filter service error:", err.message);
    return {
      allowed: true, // Never block — assume LEGAL on failure
      category: "LEGAL",
      reason: CONFIG.defaultReasons.LEGAL,
    };
  }
}
