import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PaymentForm = () => {
  const [user, setUser] = useState(null);
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
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
      navigate("/otp");
    }
  };

  const initiatePayment = async () => {
    setShowConfirm(true);
  };

  const proceedWithPayment = async () => {
    setShowConfirm(false);
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not authenticated");

      const { data } = await axios.post(
        "http://localhost:3000/initiate",
        { userId: user._id, amount },
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
    if (!order || !order.id) {
      alert("Invalid Razorpay order! Please try again.");
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
          navigate("/success");
        } catch (error) {
          alert("Payment processing failed!");
        }
      },
    };

    if (!window.Razorpay) {
      alert("Razorpay SDK not loaded!");
      return;
    }

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div>
      <h2>Payment Form</h2>
      {user ? (
        <>
          <h3>User: {user.name}</h3>
          <h3>Mobile: {user.phone}</h3>
          <input
            type="number"
            placeholder="Enter Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button onClick={initiatePayment} disabled={loading}>
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </>
      ) : (
        <p>Loading user details...</p>
      )}

      {showConfirm && (
        <div className="popup">
          <p>Are you sure you want to transfer ₹{amount}?</p>
          <button onClick={proceedWithPayment}>Yes</button>
          <button onClick={() => setShowConfirm(false)}>No</button>
        </div>
      )}
    </div>
  );
};

export default PaymentForm;
