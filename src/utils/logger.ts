import winston from "winston";
import "winston-mongodb";
import dotenv from "dotenv/config";
import fs from "fs";

const logDir = "../logs";
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "../logs/payment.log" }),

    new winston.transports.File({
      filename: "../logs/error.log",
      level: "error",
    }),

    new winston.transports.MongoDB({
      db: process.env.MONGO_URI || "mongodb://localhost:27017/paymentLogs",
      collection: "payment_logs",
      options: { useNewUrlParser: true, useUnifiedTopology: true },
      level: "info",
    }),

    new winston.transports.Console(),
  ],
});

export default logger;
