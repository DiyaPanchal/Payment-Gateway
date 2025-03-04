import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PaymentForm = () => {
  const [user, setUser] = useState(null);
  const [amount, setAmount] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [users, setUsers] = useState([]);
  const [transactionId, setTransactionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchUsers();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated");

      const { data } = await axios.get("http://localhost:3000/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data);
    } catch (error) {
      alert(error.response?.data?.message || "Error fetching user profile");
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated");

      const { data } = await axios.get("http://localhost:3000/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const initiateOtpVerification = async () => {
    try {
      setLoading(true);
      if (!user || !user.phone) throw new Error("User data is missing");
      await axios.post("http://localhost:3000/sendotp", { phone: user.phone });
      alert("OTP sent to your registered mobile number");
      setShowOtpInput(true);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndProceed = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated");
      const { data } = await axios.post(
        "http://localhost:3000/verifyotp",
        { phone: user.phone, otp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.message === "OTP verified successfully") {
        processPayment();
      }
    } catch (error) {
      alert(error.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated");
      const { data } = await axios.post(
        "http://localhost:3000/initiate",
        { userId: user._id, recipientId, amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data.order || !data.order.id) {
        throw new Error("Invalid order data received from server");
      }
      setTransactionId(data.transaction.id);
      processRazorpay(data.order);
    } catch (error) {
      alert(error.response?.data?.message || "Payment initiation failed!");
    } finally {
      setLoading(false);
    }
  };

  const processRazorpay = (order) => {
    if (!window.Razorpay) {
      alert("Razorpay SDK not loaded!");
      return;
    }
    const options = {
      key: "rzp_test_3LvFxWtDmn26ge",
      amount: order.amount,
      currency: "INR",
      name: "Test Payment",
      order_id: order.id,
      handler: async (response) => {
        try {
          await axios.post("http://localhost:3000/process", {
            transactionId,
            paymentId: response.razorpay_payment_id,
          });
          alert("Payment Successful!");
          navigate("/");
        } catch (error) {
          alert(error.response?.data?.message || "Payment processing failed!");
        }
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="payment-container">
      <h2>Payment Form</h2>
      {user ? (
        <div className="payment-box">
          <h3>User: {user.name}</h3>
          <h3>Mobile: {user.phone}</h3>
          <label>Select Recipient:</label>
          <select
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
          >
            <option value="">-- Select --</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.phone})
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Enter Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {!showOtpInput ? (
            <button
              className="pay-button"
              onClick={initiateOtpVerification}
              disabled={loading}
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button
                className="otp-button"
                onClick={verifyOtpAndProceed}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Submit OTP"}
              </button>
            </>
          )}
        </div>
      ) : (
        <p>Loading user details...</p>
      )}
    </div>
  );
};

export default PaymentForm;
