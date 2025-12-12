/**
 * searchCaselaws
 * ---------------
 * Queries the MeiliSearch "case_laws" index to retrieve relevant legal case documents
 * based on a search query.
 *
 * Features:
 * - Sends a GET request to the MeiliSearch endpoint.
 * - Limits the number of results returned (default: 5).
 * - Returns an array of case objects (hits) containing case details.
 *
 * @param {string} query - The search string or keyword(s) to query the case laws.
 *
 * @returns {Promise<Array<Object>>}
 *   - Array of case objects returned by MeiliSearch.
 *   - Each object typically contains fields like `id` and `case_discription_plain`.
 *   - Returns an empty array if there is an error or no results found.
 *
 * @example
 * const cases = await searchCaselaws("PLD 2010 Federal");
 * console.log(cases[0].case_discription_plain);
 *
 * @throws {Error} Errors are caught internally and logged. Function returns empty array on failure.
 */

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function searchDataBase(query, searchType) {
  const apiKey = process.env.SEARCH_API;
  const SearchUrl = process.env.SEARCH_URL;
  try {
    const response = await axios.get(
      `${SearchUrl}/indexes/${searchType}/search`,
      {
        params: { q: query, limit: 100 }, // increase or decrease the limit as required
        headers: {
          //SEARCH_API
          Authorization: `Bearer ${apiKey}`, // Authorization key
          "Content-Type": "application/json",
        },
      }
    );

    //Return only the useful part of response
    return response.data.hits;
  } catch (error) {
    console.error("Error searching MeiliSearch:", error.message);
    return [];
  }
}
