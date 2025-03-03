import { Request, Response } from "express";
import Transaction from "../models/Transaction";

export const initiatePayment = async (req: Request, res: Response):Promise<any> => {
  try {
    const { userId, amount } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const transaction = await Transaction.create({
      userId,
      amount,
      status: "Pending",
    });
    res.status(201).json({ message: "Payment initiated", transaction });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const processPayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId);

    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    try {
      transaction.status = "Initiated";
      await transaction.save();

      transaction.status = "Deducted";
      await transaction.save();

      transaction.status = "Credited";
      await transaction.save();

      res.json({ message: "Payment successful", transaction });
    } catch (processError) {
      transaction.status = "Failed";
      transaction.reason = "Transaction process failed";
      await transaction.save();
      return res
        .status(500)
        .json({ message: "Payment failed", error: processError });
    }
  } catch (error) {
    res.status(500).json({ message: "Error processing payment", error });
  }
};
