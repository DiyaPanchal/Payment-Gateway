import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PaymentForm = () => {
  const [user, setUser] = useState(null);
  const [amount, setAmount] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
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

  const handleRecipientChange = (e) => {
    const selectedId = e.target.value;
    setRecipientId(selectedId);

    // Find the selected user from the users array
    const user = users.find((u) => u._id === selectedId);
    setSelectedUser(user || null); // Store user details or null if not found
  };

  const createOrder = async (amount) => {
    try {
      const response = await axios.post("http://localhost:3000/create-order", {
        amount: amount,
        currency: "INR",
      });

      return response.data.orderId;
    } catch (error) {
      console.error("Error creating order:", error);
      return null;
    }
  };

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

  // const processPayment = async () => {
  //   try {
  //     setLoading(true);
  //     const token = localStorage.getItem("token");
  //     if (!token) throw new Error("User not authenticated");
  // const { data } = await axios.post(
  //   "http://localhost:3000/initiate",
  //   { userId: user._id, recipientId, amount },
  //   { headers: { Authorization: `Bearer ${token}` } }
  // );
  //     if (!data.order || !data.order.id) {
  //       throw new Error("Invalid order data received from server");
  //     }
  //     setTransactionId(data.transaction.id);
  //     processRazorpay(data.order);
  //   } catch (error) {
  //     alert(error.response?.data?.message || "Payment initiation failed!");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const initiatePayment = async () => {
  //   const token = localStorage.getItem("token");
  //   if (!token) throw new Error("User not authenticated");

  //   const response = await axios.post(
  //     "http://localhost:3000/initiate",
  //     { userId: user._id, recipientId, amount },
  //     { headers: { Authorization: `Bearer ${token}` } }
  //   );

  //   console.log(response, "initiate payment response");
  // };

  const processRazorpay = async () => {
    if (!window.Razorpay) {
      alert("Some Error Occured.Plz try again!");
      return;
    }

    try {
      const orderId = await createOrder(amount);

      const options = {
        key: "rzp_test_3LvFxWtDmn26ge",
        amount: amount * 100,
        currency: "INR",
        name: "Test Payment",
        order_id: orderId,
        prefill: {
          name: selectedUser.name,
          contact: selectedUser.phone,
        },
        handler: async (response) => {
          try {
            const paymentDetails = await axios.get(
              `http://localhost:3000/get-payment-status/${response.razorpay_payment_id}`
            );

            const saveResponse = await axios.post(
              "http://localhost:3000/save-transaction",
              {
                recipientId,
                orderId,
                paymentId: response.razorpay_payment_id,
                amount,
                status: paymentDetails.data.status,
                date: new Date().toISOString(),
              }
            );

            console.log("SaveResponse", saveResponse);

            alert("Payment Successful!");
            // navigate("/");
          } catch (error) {
            console.log("RazroPayError", JSON.stringify(error));
            alert(
              error.response?.data?.message || "Payment processing failed!"
            );
          }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.log("RazroPayError", JSON.stringify(error));
    }
  };

  return (
    <div className="payment-container">
      <h2>Payment Form</h2>
      {user ? (
        <div className="payment-box">
          <h3>User: {user.name}</h3>
          <h3>Mobile: {user.phone}</h3>
          <label>Select Recipient:</label>
          <select value={recipientId} onChange={handleRecipientChange}>
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
              onClick={processRazorpay}
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
                onClick={processPayment}
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
