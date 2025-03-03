import { Request, Response } from "express";
import Razorpay from "razorpay";
import Transaction from "../models/Transaction";
import User from "../models/User";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

async function isOTPVerified(userId: string) {
  const user = await User.findById(userId);
  return user && !user.otp; 
}

export const initiatePayment = async (req: Request, res: Response):Promise<any> => {
  try {
    const { userId, amount } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!(await isOTPVerified(userId)))
      return res.status(403).json({ message: "OTP verification required" });

    const transaction = await Transaction.create({
      userId,
      amount,
      status: "Pending",
    });

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: transaction.id,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    transaction.status = "Initiated";
    transaction.orderId = order.id;
    await transaction.save();

    res.status(201).json({
      message: "Payment initiated",
      transaction,
      order,
      phone: user.phone,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const confirmPayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { transactionId, paymentId } = req.body;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });
    if (transaction.status !== "Initiated")
      return res.status(400).json({ message: "Invalid transaction state" });

    const user = await User.findById(transaction.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.balance < transaction.amount) {
      transaction.status = "Failed";
      transaction.reason = "Insufficient balance";
      await transaction.save();
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const session = await Transaction.startSession();
    session.startTransaction();
    try {
      user.balance -= transaction.amount;
      await user.save({ session });
      transaction.status = "Deducted";
      transaction.paymentId = paymentId;
      await transaction.save({ session });
      await session.commitTransaction();
      session.endSession();

      res.json({ message: "Payment deducted from user", transaction });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      transaction.status = "Failed";
      transaction.reason = "Transaction error";
      await transaction.save();
      res.status(500).json({ message: "Transaction failed", error: err });
    }
  } catch (error) {
    res.status(500).json({ message: "Error confirming payment", error });
  }
};

export const processPayment = async (req: Request, res: Response):Promise<any> => {
  try {
    const { transactionId } = req.body;
    const transaction = await Transaction.findById(transactionId);

    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    if (
      transaction.status !== "Confirmed" &&
      transaction.status !== "Deducted"
    ) {
      return res.status(400).json({ message: "Invalid transaction state" });
    }

    transaction.status = "Credited";
    await transaction.save();

    res.json({ message: "Payment processed successfully", transaction });
  } catch (error) {
    res.status(500).json({ message: "Error processing payment", error });
  }
};
