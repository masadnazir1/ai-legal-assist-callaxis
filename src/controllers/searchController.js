/**
 * searchController
 * ----------------
 * Handles user legal queries via POST /api/search.
 *
 * Workflow:
 * 1. Validates the user query and session ID.
 * 2. Uses AI to classify query type (statute, caselaw, or none) and enhance it.
 * 3. Performs parallel searches in MeiliSearch for statutes and/or case laws.
 * 4. Streams an AI-generated response using the relevant search results.
 * 5. Returns HTTP 500 if any error occurs before streaming starts.
 *
 * Inputs (req.body):
 *   - query: string (user legal query)
 *   - session_id: string (unique session identifier)
 *
 * Outputs:
 *   - Streams AI response incrementally via SSE (res)
 *   - Returns JSON error if validation or pre-streaming fails
 */

import { searchDataBase } from "../services/searchDataBase.Service.js";
import { generateAIResponse } from "../services/LLMService.js";
import { generateSearchableKeyword } from "../services/aiKeywordService.js";
import { generateStatuteKeyword } from "../services/generateStatuteKeyword.js";
import { analyzeAndEnhanceQuery } from "../services/analyzeAndEnhanceQuery.js";

export const searchController = async (req, res) => {
  const { query, session_id } = req.body;

  try {
    // Validate inputs
    if (!query || !session_id) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "query or session_id is missing",
      });
    }

    // Analyze & enhance query
    const analysis = await analyzeAndEnhanceQuery(query);
    console.log("analysis", analysis);

    const searchPromises = {};

    // Caselaw
    if (
      analysis?.search_type === "caselaw" ||
      analysis?.search_type === "both"
    ) {
      searchPromises.caselaws = generateSearchableKeyword(query).then(
        async (k) => {
          if (k.search) {
            console.time("Caselaw search");
            const results = await searchDataBase(k.keyword, "case_laws");
            console.timeEnd("Caselaw search");
            return results;
          }
          return [];
        }
      );
    }

    // Statute
    if (
      analysis?.search_type === "statute" ||
      analysis?.search_type === "both"
    ) {
      searchPromises.statutes = generateStatuteKeyword(query).then(
        async (k) => {
          if (k.search) {
            console.time("Statute search");
            const results = await searchDataBase(k.keyword, "statues");
            console.timeEnd("Statute search");
            return results;
          }
          return [];
        }
      );
    }

    // Execute all searches in parallel
    const results = await Promise.all(Object.values(searchPromises));

    // Map results back to keys
    const keys = Object.keys(searchPromises);
    const caselawsResult = results[keys.indexOf("caselaws")] || [];
    const statutesResult = results[keys.indexOf("statutes")] || [];

    console.log(
      "Search results:",
      "Caselaws =",
      caselawsResult.length,
      "Statutes =",
      statutesResult.length
    );

    // Stream AI response
    await generateAIResponse(
      session_id,
      analysis?.enhanced_query,
      caselawsResult,
      statutesResult,
      res
    );
  } catch (err) {
    console.error("Error in searchController:", err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
};
