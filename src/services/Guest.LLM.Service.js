import crypto from "crypto";
import dotenv from "dotenv";
import OpenAI from "openai";
import { logger } from "../Utils/logger.js";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Track active streams so we can abort them on client disconnect
const activeControllers = {};

// Very simple in-memory chat sessions: { userId -> { history, lastUsed } }
const chatSessions = new Map();
const GuestUserQueryQuota = new Map();

// ---- Allowed Links (ONLY these) ----
const ALLOWED_LINKS = Object.freeze({
  landing: "https://new.pakistanlawhelp.com/",
  consultants: "https://new.pakistanlawhelp.com/consultants",
  pricing: "https://new.pakistanlawhelp.com/pricing",
  about: "https://new.pakistanlawhelp.com/about",
  contact: "https://new.pakistanlawhelp.com/contact",
  dashboard: "https://new.pakistanlawhelp.com/dashboard",
  myCases: "https://new.pakistanlawhelp.com/dashboard/myCases",
  findConsultantsDashboard:
    "https://new.pakistanlawhelp.com/dashboard/findConsaltants",
  profile: "https://new.pakistanlawhelp.com/dashboard/profile",
  billing: "https://new.pakistanlawhelp.com/dashboard/Billing",
  switchRole: "https://new.pakistanlawhelp.com/switch-role",
});

const ALLOWED_URL_SET = new Set(Object.values(ALLOWED_LINKS));

// Cleanup old sessions every 2 hours (runs every 10 minutes)
setInterval(() => {
  const now = Date.now();
  const EXPIRATION = 2 * 60 * 60 * 1000; // 2 hours

  for (const [userId, session] of chatSessions.entries()) {
    if (now - session.lastUsed > EXPIRATION) {
      chatSessions.delete(userId);
      logger.info(`Deleted inactive chat session for user: ${userId}`);
    }
  }
}, 10 * 60 * 1000);

// -------------------------
// Link Policy + Routing
// -------------------------

function normalizeText(s = "") {
  return String(s).toLowerCase().replace(/\s+/g, " ").trim();
}

function userExplicitlyAskedForLink(q) {
  const t = normalizeText(q);
  return (
    t.includes("link") ||
    t.includes("url") ||
    t.includes("website") ||
    t.includes("page") ||
    t.includes("where can i") ||
    t.includes("where do i") ||
    t.includes("open") ||
    t.includes("go to") ||
    t.includes("navigate") ||
    t.includes("redirect")
  );
}

/**
 * Decide which links (if any) are allowed to appear in THIS response.
 * This is the heart of "don’t append links at all" + "only show when needed naturally".
 */
function getAllowedLinksForThisResponse({ userQuery, reason }) {
  const q = normalizeText(userQuery);

  // Hard triggers (system-driven):
  if (reason === "quota_exceeded") {
    // Acquisition-driven but minimal: pricing + switch-role (subscribe seamlessly) + landing as fallback
    return new Set([
      ALLOWED_LINKS.pricing,
      ALLOWED_LINKS.switchRole,
      ALLOWED_LINKS.landing,
    ]);
  }

  // User intent-driven:
  // Earn money -> push legal consultant path + switch role
  if (
    q.includes("earn money") ||
    q.includes("make money") ||
    q.includes("income") ||
    q.includes("kamai") ||
    q.includes("paise") ||
    q.includes("how to earn") ||
    q.includes("how can i earn") ||
    q.includes("earning")
  ) {
    return new Set([
      ALLOWED_LINKS.switchRole,
      ALLOWED_LINKS.consultants,
      ALLOWED_LINKS.pricing,
    ]);
  }

  // Find consultant / case help
  if (
    q.includes("consultant") ||
    q.includes("lawyer") ||
    q.includes("advocate") ||
    q.includes("vakil") ||
    q.includes("near me") ||
    q.includes("nearby") ||
    (q.includes("find") &&
      (q.includes("consultant") || q.includes("lawyer"))) ||
    q.includes("case") ||
    q.includes("legal help") ||
    q.includes("hire")
  ) {
    // Guest typically should be sent to public consultants
    // If they are logged-in (not known here), dashboard find consultants also exists, but we keep it safe.
    return new Set([ALLOWED_LINKS.consultants, ALLOWED_LINKS.switchRole]);
  }

  // Legal resources / researcher access / role switch requests
  if (
    q.includes("legal resources") ||
    q.includes("resources") ||
    q.includes("research") ||
    q.includes("researcher") ||
    q.includes("case law") ||
    q.includes("caselaw") ||
    q.includes("statute") ||
    q.includes("role") ||
    q.includes("switch role") ||
    q.includes("upgrade") ||
    q.includes("subscribe") ||
    q.includes("subscription") ||
    q.includes("billing") ||
    q.includes("pricing")
  ) {
    // direct them to switch role + pricing
    return new Set([
      ALLOWED_LINKS.switchRole,
      ALLOWED_LINKS.pricing,
      ALLOWED_LINKS.billing,
    ]);
  }

  // About/contact/dashboard/profile/mycases direct asks
  const askedForLink = userExplicitlyAskedForLink(userQuery);

  if (askedForLink) {
    // Try to map common navigation questions
    if (q.includes("about")) return new Set([ALLOWED_LINKS.about]);
    if (q.includes("contact") || q.includes("support"))
      return new Set([ALLOWED_LINKS.contact]);
    if (q.includes("dashboard")) return new Set([ALLOWED_LINKS.dashboard]);
    if (q.includes("profile")) return new Set([ALLOWED_LINKS.profile]);
    if (q.includes("billing")) return new Set([ALLOWED_LINKS.billing]);
    if (q.includes("my cases") || q.includes("mycases"))
      return new Set([ALLOWED_LINKS.myCases]);
    if (q.includes("find") && q.includes("consult"))
      return new Set([
        ALLOWED_LINKS.consultants,
        ALLOWED_LINKS.findConsultantsDashboard,
      ]);
    if (q.includes("pricing")) return new Set([ALLOWED_LINKS.pricing]);
    if (q.includes("switch")) return new Set([ALLOWED_LINKS.switchRole]);

    // Generic "give me website link"
    return new Set([ALLOWED_LINKS.landing]);
  }

  // Default: no links
  return new Set();
}

/**
 * Remove ALL urls unless they are in allowedUrlsForResponse.
 * Also strips markdown links pointing to disallowed URLs.
 */
function sanitizeLinksFromText(text, allowedUrlsForResponse = new Set()) {
  if (!text) return text;

  // 1) Remove bare URLs not allowed
  const urlRegex = /https?:\/\/[^\s)>\]]+/gi;
  text = text.replace(urlRegex, (url) =>
    allowedUrlsForResponse.has(url) ? url : ""
  );

  // 2) Remove markdown links [label](url) if url not allowed
  //    If allowed, keep as-is.
  const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi;
  text = text.replace(mdLinkRegex, (m, label, url) => {
    return allowedUrlsForResponse.has(url) ? `[${label}](${url})` : label; // keep label text, drop link
  });

  return text;
}

/**
 * Build an acquisition-driven quota message WITHOUT dumping many links.
 * Uses ONLY allowed links.
 */
function buildQuotaExceededMarkdown({ dailyLimit, allowedUrlsForResponse }) {
  // We know allowedUrlsForResponse contains pricing + switchRole + landing (set earlier).
  const pricing = ALLOWED_LINKS.pricing;
  const switchRole = ALLOWED_LINKS.switchRole;

  const md = `
## ⚖️ Free Guest Limit Reached

Hey 👋 You’ve used your **${dailyLimit} free questions** for now.

To keep going with **Lexi** (and unlock more features), you can upgrade in a smooth way:

- **Upgrade / subscribe**: [View plans & pricing](${pricing})
- **Switch to a subscribed role** (and subscribe if needed): [Switch role](${switchRole})

If you want, tell me what you were trying to do (ask a question, find a consultant, or access legal research) and I’ll guide you in the best way 😊
`.trim();

  return sanitizeLinksFromText(md, allowedUrlsForResponse);
}

/**
 * System instructions that enforce:
 * - no random links
 * - only allowed links and only when necessary
 * - acquisition-driven behavior for specific categories
 */
function buildSystemPrompt(allowedUrlsForResponse) {
  // Keep this concise but strict.
  // IMPORTANT: We also enforce via sanitization, so even if the model violates, output stays clean.
  const allowedListText = Array.from(allowedUrlsForResponse).length
    ? `Allowed URLs you may use ONLY if truly needed in this reply:\n- ${Array.from(
        allowedUrlsForResponse
      ).join("\n- ")}`
    : `Do not include any links in this reply unless the user explicitly asks for a link or navigation.`;

  return `
You are "Lexi", a super friendly Pakistani legal assistant 🙂.

Core behavior:
- Explain Pakistani law concepts in simple, everyday language.
- You are NOT their lawyer and not giving formal legal advice.
- Encourage consulting a qualified lawyer for serious/high-risk issues.

CRITICAL link rule (must follow):
- NEVER append links by default.
- Use links ONLY when it is naturally required:
  1) The user explicitly asks for a link / where to go
  2) The user hit a limit or needs access tied to a page (pricing/role switch)
  3) The user needs a consultant (send them to the proper find consultant page)
- When you include a link, use Markdown format only: [Label](URL)
- Use ONLY the allowed URLs for THIS response. Never invent URLs, never add extra pages.

Acquisition-driven guidance (but stay friendly, not pushy):
- If user asks "how to earn money with PakistanLawHelp": suggest they join as a **Legal Consultant**, explain they can receive user cases and earn, and guide them to switch role if needed.
- If user asks for legal resources/researcher access: explain they need the appropriate role/subscription and guide to switch role / pricing.
- If user has a case and needs help: guide them to find a consultant near them.

Limits:
- You do NOT have access to a full caselaw/statute database here.
- Do NOT invent citations, section numbers, or case numbers.
- If asked for citations, say you can explain the concept generally and suggest consulting a lawyer for exact references.

Tone:
- Warm, polite, conversational, short.
- 2–4 emojis max per reply 💬✨.
- Ask one question at a time when you need details.

${allowedListText}
`.trim();
}

/**
 * Simple legal assistant response generator
 * - userId: unique ID for the user/session
 * - userQuery: user's message text
 * - res: Express response object (for SSE streaming). If null, returns full text instead.
 */
export const GuestLLMService = async (userId, userQuery, res = null) => {
  const streamId = crypto.randomUUID();
  const controller = new AbortController();
  activeControllers[streamId] = controller;

  if (res) {
    res.setHeader("X-Stream-ID", streamId);
  }

  const userQuotaHistory = GuestUserQueryQuota.get(userId) || {
    userId: userId,
    userRequest: 0,
  };

  userQuotaHistory.userRequest += 1;
  GuestUserQueryQuota.set(userId, userQuotaHistory);

  function getUserQuota(userId) {
    return (
      GuestUserQueryQuota.get(userId) || {
        userId,
        userRequest: 0,
      }
    );
  }

  const DAILY_LIMIT = 20;

  function hasEnoughQuota(userId) {
    const quota = getUserQuota(userId);
    return quota.userRequest < DAILY_LIMIT;
  }

  // QUOTA EXCEEDED => acquisition-driven markdown with ONLY allowed links
  if (!hasEnoughQuota(userId)) {
    const allowedUrlsForResponse = getAllowedLinksForThisResponse({
      userQuery,
      reason: "quota_exceeded",
    });

    const signupMarkdown = buildQuotaExceededMarkdown({
      dailyLimit: DAILY_LIMIT,
      allowedUrlsForResponse,
    });

    if (!res) {
      delete activeControllers[streamId];
      return { text: signupMarkdown };
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    res.write(`data: ${JSON.stringify({ content: signupMarkdown })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();

    logger.info(`Quota exceeded for user: ${userId}, upsell prompt sent.`);
    delete activeControllers[streamId];
    return;
  }

  // Get or create session
  const session = chatSessions.get(userId) || {
    history: [],
    lastUsed: Date.now(),
  };

  session.lastUsed = Date.now();
  const history = session.history;

  // Determine which links are allowed for THIS response (usually none)
  const allowedUrlsForResponse = getAllowedLinksForThisResponse({
    userQuery,
    reason: "normal",
  });

  const systemPrompt = buildSystemPrompt(allowedUrlsForResponse);

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userQuery },
  ];

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.6,
      max_tokens: 1600,
      stream: !!res,
    });

    let fullText = "";

    // Non-streaming mode
    if (!res) {
      for await (const chunk of stream ?? []) {
        fullText += chunk.choices?.[0]?.delta?.content || "";
      }

      const cleaned = sanitizeLinksFromText(
        fullText.trim(),
        allowedUrlsForResponse
      );

      session.history.push({ role: "user", content: userQuery });
      session.history.push({ role: "assistant", content: cleaned });
      if (session.history.length > 20) {
        session.history.splice(0, session.history.length - 20);
      }
      chatSessions.set(userId, session);

      return { text: cleaned };
    }

    // Streaming SSE mode
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    res.on("close", () => {
      if (activeControllers[streamId]) {
        controller.abort();
        delete activeControllers[streamId];
        logger.info(`Client disconnected, stream aborted: ${streamId}`);
      }
    });

    // Stream chunks but sanitize links per chunk
    for await (const chunk of stream ?? []) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (!content) continue;

      fullText += content;

      // sanitize chunk so we never leak disallowed links mid-stream
      const safeChunk = sanitizeLinksFromText(content, allowedUrlsForResponse);
      if (!safeChunk) continue;

      res.write(`data: ${JSON.stringify({ content: safeChunk })}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();

    const cleanedFull = sanitizeLinksFromText(
      fullText.trim(),
      allowedUrlsForResponse
    );

    session.history.push({ role: "user", content: userQuery });
    session.history.push({ role: "assistant", content: cleanedFull });
    if (session.history.length > 20) {
      session.history.splice(0, session.history.length - 20);
    }
    chatSessions.set(userId, session);

    logger.info(`Stream completed successfully for user: ${userId}`);
  } catch (error) {
    if (error?.status === 429 || error?.code === "insufficient_quota") {
      logger.error("OpenAI quota exceeded");
      if (res && !res.headersSent) {
        res.write(
          `data: ${JSON.stringify({ error: "OpenAI quota exceeded" })}\n\n`
        );
        res.write(`data: [DONE]\n\n`);
        res.end();
      }
      return;
    }

    if (error?.name === "AbortError") {
      logger.warn(`Stream aborted: ${streamId}`);
      return;
    }

    logger.error("OpenAI Stream Error:", error?.message);
    if (res && !res.headersSent) {
      res.write(
        `data: ${JSON.stringify({
          error: error?.message || "Failed to stream AI response",
        })}\n\n`
      );
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  } finally {
    delete activeControllers[streamId];
  }
};
