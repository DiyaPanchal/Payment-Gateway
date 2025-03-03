import { useState } from "react";
import axios from "axios";

const PaymentForm = () => {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [mobile, setMobile] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const fetchUserDetails = async () => {
    try {
      const { data } = await axios.get(
        `http://localhost:3000/get-user/${userId}`
      );
      setMobile(data.phone);
    } catch (error) {
      alert("Error fetching user details");
    }
  };

  const sendOtp = async () => {
    try {
      await axios.post("http://localhost:3000/sendotp", { mobile });
      setOtpSent(true);
      alert(`OTP sent to ${mobile}`);
    } catch (error) {
      alert("Error sending OTP");
    }
  };

  const verifyOtpAndInitiatePayment = async () => {
    try {
      await axios.post("http://localhost:3000/verifyotp", { mobile, otp });

      const { data } = await axios.post("http://localhost:3000/initiate", {
        userId,
        amount,
      });
      setTransactionId(data.transaction.id);

      alert("OTP verified! Initiating payment...");

      const options = {
        key: "YOUR_RAZORPAY_KEY_ID",
        amount: data.order.amount,
        currency: "INR",
        name: "Test Payment",
        order_id: data.order.id,
        handler: function (response) {
          verifyPayment(
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      alert("OTP verification failed");
    }
  };

  const verifyPayment = async (paymentId, signature) => {
    try {
      await axios.post("http://localhost:3000/verify-payment", {
        transactionId,
        paymentId,
        signature,
      });
      alert("Payment successful!");
    } catch (error) {
      alert("Payment verification failed");
    }
  };

  return (
    <div>
      <h2>Payment Form</h2>
      <input
        type="text"
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <button onClick={fetchUserDetails}>Fetch User</button>

      {mobile && (
        <>
          <h3>User Mobile: {mobile}</h3>
          <button onClick={sendOtp}>Send OTP</button>
        </>
      )}

      {otpSent && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={verifyOtpAndInitiatePayment}>
            Verify OTP & Pay
          </button>
        </>
      )}
    </div>
  );
};

export default PaymentForm;
