import { Request, Response } from "express";
import Razorpay from "razorpay";
import Transaction from "../models/Transaction";
import User from "../models/User";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export const initiatePayment = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { userId, amount } = req.body;
    console.log("Received payment initiation request:", { userId, amount });

    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", user);

    if (!user.isOtpVerified) {
      console.log("OTP not verified for user:", user.phone);
      return res.status(403).json({ message: "OTP verification required" });
    }

    console.log("Creating transaction...");
    const transaction = await Transaction.create({
      userId,
      amount,
      status: "Pending",
    });

    console.log("Transaction created:", transaction);

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: transaction.id,
      payment_capture: 1,
    };

    console.log("Creating Razorpay order...");
    const order = await razorpay.orders.create(options);
    console.log("Razorpay order created:", order);

    transaction.status = "Initiated";
    transaction.orderId = order.id;
    await transaction.save();

    console.log("Payment initiation successful!");
    res.status(201).json({
      message: "Payment initiated",
      transaction,
      order,
      phone: user.phone,
    });
  } catch (error) {
    console.error("Error in payment initiation:", error);
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

export const processPayment = async (
  req: Request,
  res: Response
): Promise<any> => {
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

    // ✅ Update transaction status
    transaction.status = "Credited";
    await transaction.save();

    // ✅ Reset `isOtpVerified` so the user needs to verify OTP next time
    const user = await User.findById(transaction.userId);
    if (user) {
      user.isOtpVerified = false;
      await user.save();
    }

    res.json({ message: "Payment processed successfully", transaction });
  } catch (error) {
    res.status(500).json({ message: "Error processing payment", error });
  }
};
