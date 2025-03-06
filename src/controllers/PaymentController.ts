import { Request, Response } from "express";
import Razorpay from "razorpay";
import Transaction from "../models/Transaction";
import User from "../models/User";
import logger from "../utils/logger"
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
    res
      .status(201)
      .json({
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


// export const confirmPayment = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { transactionId, paymentId } = req.body;
//     const transaction = await Transaction.findById(transactionId);
//     if (!transaction)
//       return res.status(404).json({ message: "Transaction not found" });
//     if (transaction.status !== "Initiated")
//       return res.status(400).json({ message: "Invalid transaction state" });

//     const user = await User.findById(transaction.userId);
//     if (!user) return res.status(404).json({ message: "User not found" });
//     if (user.balance < transaction.amount) {
//       transaction.status = "Failed";
//       transaction.reason = "Insufficient balance";
//       await transaction.save();
//       return res.status(400).json({ message: "Insufficient balance" });
//     }

//     const session = await Transaction.startSession();
//     session.startTransaction();
//     try {
//       user.balance -= transaction.amount;
//       await user.save({ session });
//       transaction.status = "Deducted";
//       transaction.paymentId = paymentId;
//       await transaction.save({ session });
//       await session.commitTransaction();
//       session.endSession();

//       res.json({ message: "Payment deducted from user", transaction });
//     } catch (err) {
//       await session.abortTransaction();
//       session.endSession();
//       transaction.status = "Failed";
//       transaction.reason = "Transaction error";
//       await transaction.save();
//       res.status(500).json({ message: "Transaction failed", error: err });
//     }
//   } catch (error) {
//     res.status(500).json({ message: "Error confirming payment", error });
//   }
// };

// export const processPayment = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   try {
//     console.log("Processing payment:", req.body);
//     console.log(req.body);
//     const { transactionId, paymentId } = req.body;
//     if (!transactionId) {
//       console.error("Error: Missing transactionId");
//       return res.status(400).json({ message: "Transaction ID is required" });
//     }

//     console.log(`Looking for transaction: ${transactionId}`);
//     const transaction = await Transaction.findById(transactionId);

//     if (!transaction) {
//       console.error("Transaction not found!");
//       return res.status(404).json({ message: "Transaction not found" });
//     }

//     console.log(
//       `Transaction found: ${transactionId}, Current Status: ${transaction.status}`
//     );

//     if (
//       !["Confirmed", "Deducted", "Initiated", "Pending"].includes(
//         transaction.status
//       )
//     ) {
//       console.error(`Invalid transaction state: ${transaction.status}`);
//       return res
//         .status(400)
//         .json({ message: `Invalid transaction state: ${transaction.status}` });
//     }

//     const payer = await User.findById(transaction.userId);
//     const recipient = await User.findById(transaction.recipientId);

//     if (!payer || !recipient) {
//       console.error("Payer or Recipient not found!");
//       return res.status(404).json({ message: "Payer or Recipient not found" });
//     }

//     if (payer.balance < transaction.amount) {
//       console.error("Insufficient balance!");
//       return res.status(400).json({ message: "Insufficient balance" });
//     }

//     payer.balance -= transaction.amount;
//     recipient.balance += transaction.amount;

//     await payer.save();
//     await recipient.save();

//     console.log(`Payer balance updated: ${payer.balance}`);
//     console.log(`Recipient balance updated: ${recipient.balance}`);

//     transaction.status = "Credited";
//     transaction.paymentId = paymentId;
//     await transaction.save();
//     console.log("Transaction updated:", transaction);

//     payer.isOtpVerified = false;
//     await payer.save();
//     console.log("Payer OTP status updated");

//     res.json({ message: "Payment processed successfully", transaction });
//   } catch (error) {
//     console.error("Error processing payment:", error);
//     res.status(500).json({ message: "Error processing payment", error });
//   }
// };

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

export const saveTransaction = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { recipientId, orderId, paymentId, amount, status, date } = req.body;
    const userId = recipientId;

    if (!userId || !orderId || !paymentId || !amount || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const amountNumber = Number(amount);
    if (isNaN(amountNumber)) {
      return res.status(400).json({ error: "Invalid amount format" });
    }

    const statusMap: { [key: string]: string } = {
      captured: "Confirmed",
      pending: "Pending",
      failed: "Failed",
    };
    const mappedStatus = statusMap[status.toLowerCase()] || "Pending";

    const transaction = new Transaction({
      userId,
      orderId,
      paymentId,
      amount: amountNumber,
      status: mappedStatus,
      date: date || new Date(),
    });
    await transaction.save();

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

export const razorpayWebhook = async (
  req: any,
  res: Response
): Promise<any> => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string | undefined;

    console.log(signature, "WebHookSignature");

    if (!signature) {
      console.error("Razorpay signature missing");
      return res.status(400).json({ error: "Signature missing" });
    }

    const body = req?.rawBody; 

    // Validate the Razorpay webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", "t6CmqzfF1yy9qw0EFxKJnCz0")
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error(" Invalid Razorpay webhook signature");
      return res.status(400).json({ error: "Invalid signature" });
    }

    const event = req.body.event;
    const payment = req.body.payload.payment.entity;

    console.log("Webhook Event:", event);

    if (event === "payment.captured") {
      await Transaction.findOneAndUpdate(
        { paymentId: payment.id },
        { status: "Confirmed" },
        { new: true }
      );
      console.log(`Payment ${payment.id} captured successfully.`);
    } else if (event === "payment.failed") {
      await Transaction.findOneAndUpdate(
        { paymentId: payment.id },
        { status: "Failed", failureReason: payment.error_description },
        { new: true }
      );
      console.log(
        ` Payment ${payment.id} failed: ${payment.error_description}`
      );
    }

    res.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error(" Error handling Razorpay webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
