import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITransaction extends Document {
  userId: string;
  orderId: string;
  paymentId?: string;
  amount: number;
  status:
    | "Pending"
    | "Confirmed"
    | "Initiated"
    | "Deducted"
    | "Credited"
    | "Failed";
  date: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: String, required: true },
    orderId: { type: String, required: true },
    paymentId: { type: String },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Initiated",
        "Deducted",
        "Credited",
        "Failed",
      ],
      default: "Pending",
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Transaction: Model<ITransaction> = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);

export default Transaction;
