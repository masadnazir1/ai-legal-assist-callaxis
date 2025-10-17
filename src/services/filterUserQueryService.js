import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function filterUserQuery(userInput) {
  try {
    const prompt = `
You are a moderation system for a Pakistani legal AI assistant.

Your job:
- Classify the user's message into one of these categories:
  1. LEGAL → Related to law, cases, constitution, judiciary, or legal rights.
  2. ABUSIVE → Contains hate, slurs, harassment, or obscene language.
  3. HARMFUL → Mentions self-harm, suicide, or violence.
  4. NON-LEGAL → Unrelated to law (like tech, sports, or personal matters). Greetings or polite conversation are LEGAL.

Return your answer strictly in this JSON format:
{
  "category": "LEGAL" | "ABUSIVE" | "HARMFUL" | "NON-LEGAL",
  "reason": "Short, natural-language explanation suitable for showing to the user. Do not repeat the input. Be polite, concise, and context-aware. Example: 'I'm here to assist only with legal matters. Please ask something law-related.'"
}

User message:
"""${userInput}"""
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Classify user input and generate a polite reason.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 100,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      result = {
        category: "NON-LEGAL",
        reason: "I can only assist with legal questions or case discussions.",
      };
    }

    const allowed = result.category === "LEGAL";
    return {
      allowed,
      reason:
        result.reason ||
        "I can only assist with legal questions, case laws, and constitutional matters in Pakistan.",
      category: result.category,
    };
  } catch (err) {
    console.error("Filter service error:", err.message);
    return {
      allowed: false,
      reason: "Filter service failed",
      category: "SYSTEM_ERROR",
    };
  }
}
