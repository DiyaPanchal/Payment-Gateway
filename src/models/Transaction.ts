import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  userId: string;
  amount: number;
  status: "Pending" | "Initiated" |"Confirmed"| "Deducted" | "Credited" | "Failed";
  orderId?: string;
  paymentId?: string;
  reason?: string;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Initiated", "Deducted", "Credited", "Failed"],
      default: "Pending",
    },
    orderId: { type: String }, 
    paymentId: { type: String }, 
    reason: { type: String },
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);
export default Transaction;
