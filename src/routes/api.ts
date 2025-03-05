import express from "express";
import bodyParser from "body-parser";
import * as PaymentController from "../controllers/PaymentController";
import * as UserController from "../controllers/UserController";
import * as OtpController from "../controllers/OtpController";
// import authMiddleware from "../middlewares/AuthMiddleware";

const apiRouter = express.Router();
apiRouter.use(bodyParser.json());

apiRouter.post("/initiate", PaymentController.initiatePayment);
// apiRouter.post("/confirm", PaymentController.confirmPayment);
// apiRouter.post("/process", PaymentController.processPayment);
// apiRouter.post("/webhook/razorpay", PaymentController.razorpayWebhook);
apiRouter.post("/create-order", PaymentController.createOrder);
apiRouter.get(
  "/get-payment-status/:paymentId",
  PaymentController.getPaymentStatus
);
apiRouter.post("/save-transaction", PaymentController.saveTransaction);

apiRouter.post("/signup", UserController.signup);
apiRouter.post("/login", UserController.login);
apiRouter.get("/profile", UserController.getProfile);
apiRouter.get("/users", UserController.getUsers);

apiRouter.post("/sendotp", OtpController.sendOTP);
apiRouter.post("/verifyotp", OtpController.verifyOTP);

export default apiRouter;
