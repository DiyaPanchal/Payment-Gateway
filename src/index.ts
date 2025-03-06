import express from "express";
import "dotenv/config";
import mongoose from "mongoose";
import cors from "cors";
import connectDB from "./config/db";
import apiRouter from "./routes/api";

const PORT = process.env.PORT || 3002;
const app = express();

// Middleware for parsing JSON
app.use(express.json());
app.use(cors());

app.use(
  "/webhook/razorpay",
  express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf.toString(); // ✅ Save rawBody for signature validation
    },
  })
);
app.use("/", apiRouter);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

connectDB();
