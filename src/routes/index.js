/**
 * @file index.js
 * @description
 * Express Router to handle search-related endpoints for the AI legal assistant.
 *
 * Routes:
 *   - POST /search
 *       Handles a user's search query, generates relevant keywords, searches case laws,
 *       and streams an AI-generated response using Server-Sent Events (SSE).
 *
 * example Usage:
 * import router from "./routes/index.js";
 * app.use("/api", router);
 *
 * Example request body:
 * {
 *   "query": "Doctrine of necessity in Pakistani law"
 * }
 *
 * Response:
 *   Streams AI response incrementally using SSE; each chunk sent as:
 *     data: <partial_text>\n\n
 */

import { Router } from "express";
import searchRoutes from "./searchRoutes.js";

const router = Router();

// Define the '/search' route to use the searchRoutes for requests to '/api/search'
router.use("/search", searchRoutes);

export default router;
