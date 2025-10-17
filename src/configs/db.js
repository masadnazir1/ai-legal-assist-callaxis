/**
 * @file db.js
 * @description
 * PostgreSQL connection setup using `pg` Pool.
 * - Reads connection details from environment variables.
 * - Exports a `pool` instance for querying the database.
 * - Automatically attempts to connect on startup and logs success or failure.
 */

import dotenv from "dotenv";
import pkg from "pg";
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
});

pool
  .connect()
  .then(() =>
    console.log("PostgreSQL connected successfully", process.env.PG_DATABASE)
  )
  .catch((err) => console.error("Database connection failed:", err));
