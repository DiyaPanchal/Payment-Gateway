import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  isOtpVerified: boolean;
  balance: number;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    isOtpVerified: { type: Boolean, default: false }, 
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
