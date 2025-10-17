import fs from "fs";
import path from "path";

const logDir = path.join(process.cwd(), "failedQueries");
const logFilePath = path.join(logDir, "failedQueries.log");

// Ensure the folder exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Logs a failed user query with reason and timestamp.
 * @param {string} query - The user query that was rejected.
 * @param {string} reason - Reason for rejection.
 */
export const logFailedQuery = (query, reason) => {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} | Query: "${query}" | Reason: ${reason}\n`;

  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) console.error("Failed to write query log:", err);
  });
};
