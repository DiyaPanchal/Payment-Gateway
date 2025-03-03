import express from "express";
import bodyParser from "body-parser";
import * as PaymentController from "../controllers/PaymentController";
import * as UserController from "../controllers/UserController";

// import authMiddleware from "../middlewares/AuthMiddleware";
// import adminMiddleware from "../middlewares/isAuthorizedMiddleware";

const apiRouter = express.Router();
apiRouter.use(bodyParser.json());


apiRouter.post("/initiate", PaymentController.initiatePayment);
apiRouter.post("/verify", PaymentController.verifyPayment);
apiRouter.post("/confirm", PaymentController.confirmPayment);
apiRouter.post("/signup", UserController.signup);
apiRouter.post("/login", UserController.login);
apiRouter.get("/profile", UserController.getProfile);

export default apiRouter;
