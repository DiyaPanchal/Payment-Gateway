import { Request, Response } from "express";
import Razorpay from "razorpay";
import Transaction, { ITransaction } from "../models/Transaction";
import User from "../models/User";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export const initiatePayment = async (req: Request, res: Response):Promise<any> => {
  try {
    const { userId, amount } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

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

export const verifyPayment = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { transactionId, paymentId, signature, orderId } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (expectedSignature !== signature) {
      transaction.status = "Failed";
      transaction.reason = "Signature mismatch or tampered response";
      await transaction.save();
      return res
        .status(400)
        .json({
          message: "Payment verification failed",
          reason: transaction.reason,
        });
    }

    transaction.status = "Credited";
    transaction.paymentId = paymentId;
    await transaction.save();

    res.json({ message: "Payment successful", transaction });
  } catch (error) {
    res.status(500).json({ message: "Payment verification failed", error });
  }
};

export const confirmPayment = async (req: Request, res: Response):Promise<any> => {
  try {
    const { transactionId } = req.body;
    const transaction = (await Transaction.findById(
      transactionId
    ).lean()) as ITransaction | null;

    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    if (transaction.status !== "Initiated")
      return res
        .status(400)
        .json({ message: "Payment is not in an initiated state" });

    transaction.status = "Confirmed";
    await Transaction.findByIdAndUpdate(transactionId, { status: "Confirmed" });

    res.json({ message: "Payment confirmed", transaction });
  } catch (error) {
    res.status(500).json({ message: "Error confirming payment", error });
  }
};
