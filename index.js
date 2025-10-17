/**
 * @file index.js
 * @description
 * Entry point for the Express server.
 * - Loads environment variables.
 * - Configures middleware and routes.
 * - Starts server and logs status.
 */

import express from "express";
import { logger } from "./src/Utils/logger.js";
import router from "./src/routes/index.js";
import dotenv from "dotenv";
import { corsMiddleware } from "./src/middlewares/corsMiddleware.js";

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware: parse JSON bodies
app.use(express.json());
app.use(corsMiddleware);

// API routes
app.use("/api", router);

// Health check / test route
app.get("/hello", (req, res) => {
  res.send("Ok, it is working!");
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
