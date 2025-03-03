import express from "express";
import bodyParser from "body-parser";
import * as PaymentController from "../controllers/PaymentController";

// import authMiddleware from "../middlewares/AuthMiddleware";
// import adminMiddleware from "../middlewares/isAuthorizedMiddleware";

const apiRouter = express.Router();
apiRouter.use(bodyParser.json());


apiRouter.post("/initiate", PaymentController.initiatePayment);
apiRouter.post("/process/:transactionId", PaymentController.processPayment);

export default apiRouter;
