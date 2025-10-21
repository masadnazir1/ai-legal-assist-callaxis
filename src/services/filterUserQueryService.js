import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CONFIG = {
  domain: "Pakistani legal AI assistant",
  categories: {
    LEGAL:
      "Mentions, implies, or requests anything related to law, judiciary, rights, constitution, legislation, judgments, legal documents, or case references (e.g., PLD, SCMR, citations).",
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
  // Expanded list of legal keywords to bias classification
  LEGAL_KEYWORDS: [
    "pld",
    "scmr",
    "case law",
    "case-law",
    "section",
    "article",
    "constitution",
    "civil",
    "criminal",
    "ipc",
    "cpc",
    "court",
    "judge",
    "law",
    "act",
    "ordinance",
    "petition",
    "suit",
    "appeal",
    "legal",
    "advocate",
    "bail",
    "rights",
    "justice",
  ],
  model: "gpt-4o-mini",
  temperature: 0.2,
  maxTokens: 120,
};

/**
 * Detect implicit legal intent using keyword heuristics before classification.
 */
function detectLegalIntent(userInput) {
  const lower = userInput.toLowerCase();
  return CONFIG.LEGAL_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Build dynamic classification prompt.
 */
function buildPrompt(userInput) {
  const categoriesList = Object.entries(CONFIG.categories)
    .map(([key, desc], i) => `${i + 1}. ${key} → ${desc}`)
    .join("\n  ");

  return `
You are a moderation system for a ${CONFIG.domain}.

Classify the user's message into one of these categories.
Use contextual understanding — if the user mentions or implies any law-related word (like PLD, SCMR, section, article, judgment, petition, etc.), always mark it as LEGAL even if not phrased as a question.

Categories:
  ${categoriesList}

Return JSON only:
{
  "category": "LEGAL" | "GREETING" | "ABUSIVE" | "HARMFUL" | "NON_LEGAL",
  "reason": "Short natural-language explanation suitable for showing to the user."
}

User message:
"""${userInput}"""
`;
}

/**
 * Filter incoming user query.
 */
export async function filterUserQuery(userInput) {
  try {
    // Heuristic prefilter: force LEGAL if strong legal keywords detected
    if (detectLegalIntent(userInput)) {
      return {
        allowed: true,
        category: "LEGAL",
        reason: CONFIG.defaultReasons.LEGAL,
      };
    }

    const prompt = buildPrompt(userInput);

    const completion = await openai.chat.completions.create({
      model: CONFIG.model,
      messages: [
        {
          role: "system",
          content:
            "Classify user input and generate a polite reason. Be sensitive to implicit legal context.",
        },
        { role: "user", content: prompt },
      ],
      temperature: CONFIG.temperature,
      max_tokens: CONFIG.maxTokens,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      result = { category: "NON_LEGAL" };
    }

    const reason =
      result.reason?.trim() ||
      CONFIG.defaultReasons[result.category] ||
      CONFIG.defaultReasons.NON_LEGAL;

    return {
      allowed: ["LEGAL", "GREETING"].includes(result.category),
      category: result.category,
      reason,
    };
  } catch (err) {
    console.error("Filter service error:", err.message);
    return {
      allowed: false,
      category: "SYSTEM_ERROR",
      reason: "Moderation service failed.",
    };
  }
}
