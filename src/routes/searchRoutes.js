/**
 * searchRoutes
 * ------------
 * Express Router to handle legal case search endpoints.
 *
 * Routes:
 * POST /case
 *   - Calls `searchController` to process a user query, search relevant case laws,
 *     and stream an AI-generated response based on the top relevant cases.
 *
 * example Usage:
 * import searchRoutes from "./routes/searchRoutes.js";
 * app.use("/api/search", searchRoutes);
 *
 * Example POST body:
 * { "query": "Doctrine of necessity in Pakistani law" }
 *
 * Response:
 * - Streams AI response using Server-Sent Events (SSE)
 */

import { Router } from "express";
import { searchController } from "../controllers/searchController.js";

const searchRoutes = Router();

// POST /case - handle legal query search and AI response streaming
searchRoutes.post("/case", searchController);

export default searchRoutes;
