import { Request, Response } from "express";
import User from "../models/User";
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

export const sendOTP = async (req: Request, res: Response): Promise<any> => {
  try {
    const { phone } = req.body;
    const verification = await client.verify.v2
      .services("VAeff4cbc3054f578dbcfaa074800ca805")
      .verifications.create({ to: phone, channel: "sms" });

    res.json({ message: "OTP sent successfully", sid: verification.sid });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Error sending OTP", error });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<any> => {
  try {
    console.log("Received OTP verification request:", req.body);

    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    const verificationCheck = await client.verify.v2
      .services("VAeff4cbc3054f578dbcfaa074800ca805")
      .verificationChecks.create({ to: phone, code: otp });

    if (verificationCheck.status !== "approved") {
      console.error("Invalid OTP for phone:", phone);
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isOtpVerified = true;
    await user.save();

    console.log("OTP verified successfully for user:", phone);
    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res
      .status(500)
      .json({ message: "Error verifying OTP", error: error});
  }
};