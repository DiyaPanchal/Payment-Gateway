import mongoose from "mongoose";
import "dotenv/config";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err}`);
  }
};
export default connectDB;
