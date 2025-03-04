import { Request, Response } from "express";
import User from "../models/User";
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID; // Set this in your .env file
const client = twilio(accountSid, authToken);

export const sendOTP = async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const verification = await client.verify.v2
      .services("VAeff4cbc3054f578dbcfaa074800ca805")
      .verifications.create({ to: phone, channel: "sms" });

    return res.json({
      message: "OTP sent successfully",
      sid: verification.sid,
    });
  } catch (error: any) {
    console.error("Error sending OTP:", error.message);
    return res
      .status(500)
      .json({ message: "Error sending OTP", error: error.message });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    // const verificationCheck = await client.verify.v2
    //   .services("VAeff4cbc3054f578dbcfaa074800ca805")
    //   .verificationChecks.create({ to: phone, code: otp });

    const verificationCheck = await client.verify.v2
      .services("VAeff4cbc3054f578dbcfaa074800ca805")
      .verificationChecks.create({ to: `+91${phone}`, code: otp });

    // if (verificationCheck.status !== "approved") {
    //   console.error("Invalid OTP for phone:", phone);
    //   return res.status(400).json({ message: "Invalid OTP" });
    // }

    // const user = await User.findOne({ phone });
    // if (!user) {
    //   console.error("User not found for phone:", phone);
    //   return res.status(404).json({ message: "User not found" });
    // }

    // user.isOtpVerified = true;
    // await user.save();

    // return res.json({ message: "OTP verified successfully" });

    if (verificationCheck.status === "approved") {
      console.log("OTP verified successfully");
      return res
        .status(200)
        .send({ message: "OTP verified successfully", success: true });
    } else {
      console.log("Invalid OTP");
      return res.status(400).send({ message: "Invalid OTP", success: false });
    }
  } catch (error: any) {
    console.error("Error verifying OTP:", JSON.stringify(error));
    return res.status(500).json({ message: "Error verifying OTP", error });
  }
};
