/**
 * @file logger.js
 * @description
 * Winston-based logger configuration with:
 *  - Console logging (colorized for development)
 *  - Daily rotating file logs for info and errors
 *  - Custom log format including timestamps and stack traces
 *  - Helper wrappers for easy usage (log.info, log.warn, log.error, log.debug)
 *  - Stream interface for HTTP request loggers (e.g., morgan)
 */

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import fs from "fs";

//  Create logs directory if not exists
const logDir = "logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.printf(
  ({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  }
);

// Create transports
const transports = [];

// Console logs (colorized for dev)
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.simple()
    ),
  })
);

// Rotating file logs (daily)
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, "app-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "10m",
    maxFiles: "14d", // keep 14 days
    level: "info",
  })
);

// Error logs separately
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, "errors-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "10m",
    maxFiles: "30d",
    level: "error",
  })
);

//  Create logger instance
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    logFormat
  ),
  transports,
  exitOnError: false,
});

// Stream for HTTP loggers (like morgan)
export const loggerStream = {
  write: (message) => logger.info(message.trim()),
};

//  Helper wrappers for clean use
export const log = {
  info: (msg) => logger.info(msg),
  warn: (msg) => logger.warn(msg),
  error: (msg, err) => logger.error(err ? `${msg} - ${err.stack || err}` : msg),
  debug: (msg) => logger.debug(msg),
};
