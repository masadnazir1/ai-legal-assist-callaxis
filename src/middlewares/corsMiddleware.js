export const corsMiddleware = (req, res, next) => {
  // Allowed origin — you can later load this from .env
  const allowedOrigin = process.env.CLIENT_URL || "http://localhost:3000";

  console.log(`
==========================================
🌐  ALLOWED CORS ORIGINS
------------------------------------------
${process.env.CLIENT_URL || "No CORS URL configured"}
==========================================
`);

  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  // Allow credentials (cookies, tokens)
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle preflight (OPTIONS) requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
};
