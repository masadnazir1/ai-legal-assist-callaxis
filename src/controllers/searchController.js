/**
 * searchController
 * ----------------
 * Express controller to handle user legal queries.
 *
 * Workflow:
 * 1. Receives a user query via POST request body.
 * 2. Generates refined search keywords using AI (`generateSearchableKeyword`).
 * 3. Searches the case law database (MeiliSearch) with the refined keywords (`searchCaselaws`).
 * 4. Streams an AI-generated response using the top relevant case laws (`generateAIResponse`).
 * 5. Handles errors gracefully and returns HTTP 500 if any step fails.
 *
 * @param {import("express").Request} req - Express request object
 *   - Expected body: { query: string } — user query or legal question.
 *
 * @param {import("express").Response} res - Express response object
 *   - Sets headers for server-sent events (SSE) if streaming AI response.
 *   - Sends AI response incrementally to client.
 *
 * @returns {Promise<void>}
 *   - Streams AI response directly to the client; does not return JSON data in normal flow.
 *
 * @example
 * // Client POST request body:
 * // { "query": "Doctrine of necessity in Pakistani law" }
 *
 * POST /api/search
 *
 * // AI response streamed back to client in chunks as server-sent events
 *
 * @throws Returns HTTP 500 JSON if any error occurs before streaming starts.
 */

import { searchCaselaws } from "../services/searchCaselaws.js";
import { generateAIResponse } from "../services/LLMService.js";
import { generateSearchableKeyword } from "../services/aiKeywordService.js";
import { filterUserQuery } from "../services/filterUserQueryService.js";
import { logFailedQuery } from "../Utils/logFailedQuery.js";
import { logger } from "../Utils/logger.js";

export const searchController = async (req, res) => {
  const { query, session_id } = req.body;

  try {
    if ((!query, !session_id)) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "query or session_id is missings ",
      });
    }
    //filter the user query and proccess accordingly
    console.time("Time taken by the filterResult");

    // const filterResult = await filterUserQuery(query);

    console.timeEnd("Time taken by the filterResult");

    // if (!filterResult.allowed) {
    //   //log on the terminal as well
    //   logger.error("Query rejected:");
    //   logFailedQuery(query, filterResult.reason);
    //   return res.status(401).json({
    //     success: false,
    //     message: filterResult.reason,
    //   });
    // }

    //Generate search keywords
    console.time("KeywordGeneration");
    const caseSearchKeyword = await generateSearchableKeyword(query);
    console.timeEnd("KeywordGeneration");

    console.log("KEYWORD SERVICE", caseSearchKeyword);

    //Search case laws
    console.time("CaseLawSearch");

    let caselow = null;

    if (caseSearchKeyword.search) {
      caselow = await searchCaselaws(caseSearchKeyword?.keyword);
    }

    console.timeEnd("CaseLawSearch");

    console.time("Time taken Generate AI response");
    //Generate AI response
    await generateAIResponse(session_id, query, caselow, res);
    console.timeEnd("Time taken Generate AI response");
    //end operations here
  } catch (err) {
    console.error("Error getting the response:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
