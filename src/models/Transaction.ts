import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: string;
  amount: number;
  status: "Pending" | "Initiated" | "Deducted" | "Credited" | "Failed";
  reason?: string;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Initiated", "Deducted", "Credited", "Failed"],
      default: "Pending",
    },
    reason: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<ITransaction>("Transaction", TransactionSchema);
