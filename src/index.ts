import express from "express";
import "dotenv/config";
import mongoose from "mongoose";
import cors from "cors";
import connectDB from "./config/db";
import apiRouter from "./routes/api";

const PORT = process.env.PORT || 3002;
const app = express();

app.use(express.json());
app.use(cors());
app.use("/",apiRouter);

// app.use('/api/payment', paymentRoutes);
// app.use('/api/auth', authRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

connectDB();