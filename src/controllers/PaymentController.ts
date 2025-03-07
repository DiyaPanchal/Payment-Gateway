import { Request, Response } from "express";
import Razorpay from "razorpay";
import Transaction from "../models/Transaction";
import User from "../models/User";
import logger from "../utils/logger";
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
    const { userId, amount, recipientId } = req.body;
    logger.info("Received payment initiation request", {
      userId,
      amount,
      recipientId,
    });

    const user = await User.findById(userId);
    if (!user) {
      logger.warn("User not found", { userId });
      return res.status(404).json({ message: "User not found" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      logger.warn("Recipient not found", { recipientId });
      return res.status(404).json({ message: "Recipient not found" });
    }

    const transaction = await Transaction.create({
      userId,
      recipientId,
      amount,
      status: "Pending",
    });
    logger.info("Transaction created", { transactionId: transaction.id });

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

    logger.info("Payment initiation successful", { orderId: order.id });
    res.status(201).json({
      message: "Payment initiated",
      transaction,
      order,
      phone: user.phone,
    });
  } catch (error) {
    logger.error("Error in payment initiation", { error });
    res.status(500).json({ message: "Server error", error });
  }
};

export const createOrder = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      payment_capture: 1,
    };
    const order = await razorpay.orders.create(options);

    logger.info("Razorpay order created", { orderId: order.id });
    res.json({ orderId: order.id });
  } catch (error) {
    logger.error("Error creating Razorpay order", { error });
    res.status(500).json({ error: "Failed to create order" });
  }
};

export const getPaymentStatus = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const paymentId = req.params.paymentId;
    const payment = await razorpay.payments.fetch(paymentId);
    logger.info("Fetched payment status", {
      paymentId,
      status: payment.status,
    });
    res.json({ status: payment.status });
  } catch (error) {
    logger.error("Error fetching payment status", { error });
    res.status(500).json({ error: "Failed to fetch payment status" });
  }
};

// export const saveTransaction = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { userId, recipientId, orderId, paymentId, amount, status, date } =
//       req.body;
//     // const userId = recipientId;

//     if (!userId || !orderId || !paymentId || !amount || !status) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const amountNumber = Number(amount);
//     if (isNaN(amountNumber)) {
//       return res.status(400).json({ error: "Invalid amount format" });
//     }

//     const statusMap: { [key: string]: string } = {
//       captured: "Captured",
//       pending: "Pending",
//       failed: "Failed",
//     };
//     const mappedStatus = statusMap[status.toLowerCase()] || "Pending";

//     const transaction = new Transaction({
//       userId,
//       recipientId,
//       orderId,
//       paymentId,
//       amount: amountNumber,
//       status: mappedStatus,
//       date: date || new Date(),
//     });
//     await transaction.save();

//     logger.info("Transaction saved successfully", {
//       transactionId: transaction.id,
//       status: transaction.status,
//     });
//     res.json({ success: true, message: "Transaction saved successfully" });
//   } catch (error) {
//     logger.error("Error saving transaction", { error });
//     res.status(500).json({ error: "Failed to save transaction" });
//   }
// };

export const saveTransaction = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { userId, recipientId, orderId, paymentId, amount, status, date } =
      req.body;

    if (
      !userId ||
      !recipientId ||
      !orderId ||
      !paymentId ||
      !amount ||
      !status
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const amountNumber = Number(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ error: "Invalid amount format" });
    }

    const statusMap: { [key: string]: string } = {
      captured: "Captured",
      pending: "Pending",
      failed: "Failed",
    };
    const mappedStatus = statusMap[status.toLowerCase()] || "Pending";

    // Fetch sender (userId) to check balance
    const sender = await User.findById(userId);
    if (!sender) {
      return res.status(404).json({ error: "Sender user not found" });
    }

    // Ensure sender has enough balance
    if (mappedStatus === "Captured" && sender.balance < amountNumber) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Save transaction
    const transaction = new Transaction({
      userId,
      recipientId,
      orderId,
      paymentId,
      amount: amountNumber,
      status: mappedStatus,
      date: date || new Date(),
    });

    await transaction.save();

    // **Update balances only if transaction is successful**
    if (mappedStatus === "Captured") {
      // Deduct amount from sender's balance
      const updatedSender = await User.findByIdAndUpdate(
        userId,
        { $inc: { balance: -amountNumber } }, // Deduct balance
        { new: true } // Return updated user
      );

      if (!updatedSender) {
        return res.status(404).json({ error: "Sender user not found" });
      }

      // Add amount to recipient's balance
      const updatedRecipient = await User.findByIdAndUpdate(
        recipientId,
        { $inc: { balance: amountNumber } }, // Increment balance
        { new: true } // Return updated user
      );

      if (!updatedRecipient) {
        return res.status(404).json({ error: "Recipient user not found" });
      }

      logger.info("Balances updated successfully", {
        senderId: userId,
        senderNewBalance: updatedSender.balance,
        recipientId: recipientId,
        recipientNewBalance: updatedRecipient.balance,
      });
    }

    logger.info("Transaction saved successfully", {
      transactionId: transaction.id,
      status: transaction.status,
    });

    res.json({ success: true, message: "Transaction saved successfully" });
  } catch (error) {
    logger.error("Error saving transaction", { error });
    res.status(500).json({ error: "Failed to save transaction" });
  }
};
