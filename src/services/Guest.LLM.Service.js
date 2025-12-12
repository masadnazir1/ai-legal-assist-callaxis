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

/**
 * Simple legal assistant response generator
 * - userId: unique ID for the user/session
 * - userQuery: user's message text
 * - res: Express response object (for SSE streaming). If null, returns full text instead.
 */
export const GuestLLMService = async (userId, userQuery, res = null) => {
  // Create a stream ID so frontend can track this stream
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

  //add the user requests
  userQuotaHistory.userRequest += 1;
  GuestUserQueryQuota.set(userId, userQuotaHistory);

  //Get User Quota (with default)
  function getUserQuota(userId) {
    return (
      GuestUserQueryQuota.get(userId) || {
        userId,
        userRequest: 0,
      }
    );
  }

  const DAILY_LIMIT = 5;
  //Check if User Has Enough Quota
  function hasEnoughQuota(userId) {
    const quota = getUserQuota(userId);
    return quota.userRequest < DAILY_LIMIT;
  }

  console.log("getUserQuota:", getUserQuota(userId));

  // If user does NOT have enough quota, send friendly signup message in advanced markdown
  if (!hasEnoughQuota(userId)) {
    const signupMarkdown = `
## ⚖️ Your Free Guest Limit Is Reached

Hey there 👋  
Thank you for using **PakistanLawHelp** and chatting with **Lexi – your AI legal assistant for Pakistani law**.

As a **guest user**, you can ask up to **4 free questions**. You’ve now reached that limit for this session.

But the good news is:  
You’re just **one quick signup** away from unlocking a more powerful legal experience 🚀

---

### 🌟 Why create a free PakistanLawHelp account?

By signing up, you can enjoy:

- ✅ **More AI-powered legal queries** – ask follow-up questions without worrying about guest limits.
- 📄 **Smart legal document drafts** – get AI-assisted drafts for:
  - Legal notices
  - Applications & replies
  - Basic agreements & undertakings
  - Simple contracts and more
- 📂 **Personal legal dashboard** – access all your past queries, drafts, and notes in one place:  
  👉 [Open your dashboard](https://new.pakistanlawhelp.com/dashboard)
- 👨‍⚖️ **Discover legal consultants** – explore profiles of legal professionals and connect with them:  
  👉 [View consultants](https://new.pakistanlawhelp.com/consultants)
- 🔐 **Secure & private workspace** – your data stays linked to your account only, not visible to others.

> 🏛️ **PakistanLawHelp** – Advanced legal research tools for Pakistan's legal community, helping legal professionals win cases faster.

---

### 🚀 Ready to continue your legal journey with Lexi?

**1️⃣ Create your free account**

> 👉 **[Sign up now](https://new.pakistanlawhelp.com/signup)**  

Takes less than a minute, and you’ll unlock a richer, more personalized legal assistant experience.

**2️⃣ Already have an account?**

> 🔐 **[Log in here](https://new.pakistanlawhelp.com/login)**  

**3️⃣ Need help signing in?**

> 😅 **[Forgot your password? Reset it here](https://new.pakistanlawhelp.com/forgot-password)**  

---

### ℹ️ Learn more & contact us

- 📘 About us: [PakistanLawHelp – who we are](https://new.pakistanlawhelp.com/about)  
- 📞 Need human help? [Contact & support](https://new.pakistanlawhelp.com/contact)

---

Once you **sign up and log in**, come back and ask me anything again —  
I’ll be right here to help you with friendly, easy-to-understand explanations of Pakistani law 😊✨
`.trim();

    // Non-streaming mode: just return the markdown as text
    if (!res) {
      delete activeControllers[streamId];
      return { text: signupMarkdown };
    }

    // --- Streaming mode (SSE) for quota exceeded message ---
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // No OpenAI call here, just stream our markdown message
    res.write(`data: ${JSON.stringify({ content: signupMarkdown })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();

    logger.info(`Quota exceeded for user: ${userId}, signup prompt sent.`);
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

  // System prompt: friendly Pakistani legal assistant, emojis, no caselaw/statutes DB
  const systemPrompt = `
You are "Lexi", a super friendly Pakistani AI legal assistant 🙂.

Your job:
- Help users understand Pakistani law in simple, everyday language.
- You are NOT their lawyer, and you are NOT giving formal legal advice.
- For serious or high-risk issues, gently suggest they consult a qualified lawyer.
- The user can also ask you about general / non-legal things and you should still respond helpfully.

Style:
- Be warm, polite, and conversational.
- Use emojis where they feel natural (2–4 per answer is usually enough 💬✨).
- If the user's question is especially creative, rare, or thoughtful, briefly appreciate that their question is interesting or unique 🙌.
- Do NOT overdo emojis; keep it readable.

Important limits (for this setup):
- You do NOT have access to any caselaw or statute database here.
- Do NOT invent or quote specific case numbers, sections, or statute names.
- Speak in general, high-level terms about the law.
- If the user asks for very specific citations, explain that you don't have direct access to caselaw/statutes in this environment, but you can still explain concepts in plain language.
`.trim();

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

    // Non-streaming mode: just return text (handy for internal use/tests)
    if (!res) {
      for await (const chunk of stream ?? []) {
        fullText += chunk.choices?.[0]?.delta?.content || "";
      }

      // Save history (user + assistant)
      session.history.push({ role: "user", content: userQuery });
      session.history.push({ role: "assistant", content: fullText.trim() });
      if (session.history.length > 20) {
        session.history.splice(0, session.history.length - 20);
      }
      chatSessions.set(userId, session);

      return { text: fullText.trim() };
    }

    // --- Streaming mode (SSE) ---

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // Abort stream if client disconnects
    res.on("close", () => {
      if (activeControllers[streamId]) {
        controller.abort();
        delete activeControllers[streamId];
        logger.info(`Client disconnected, stream aborted: ${streamId}`);
      }
    });

    // Send chunks as they arrive
    for await (const chunk of stream ?? []) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (!content) continue;

      fullText += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    // Tell client we're done
    res.write(`data: [DONE]\n\n`);
    res.end();

    // Update history after full response
    session.history.push({ role: "user", content: userQuery });
    session.history.push({ role: "assistant", content: fullText.trim() });
    if (session.history.length > 20) {
      session.history.splice(0, session.history.length - 20);
    }
    chatSessions.set(userId, session);

    logger.info(`Stream completed successfully for user: ${userId}`);
  } catch (error) {
    // Quota / rate limit
    if (error.status === 429 || error.code === "insufficient_quota") {
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

    // Aborted by client
    if (error.name === "AbortError") {
      logger.warn(`Stream aborted: ${streamId}`);
      return;
    }

    // Other errors
    logger.error("OpenAI Stream Error:", error.message);
    if (res && !res.headersSent) {
      res.write(
        `data: ${JSON.stringify({
          error: error.message || "Failed to stream AI response",
        })}\n\n`
      );
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  } finally {
    delete activeControllers[streamId];
  }
};
