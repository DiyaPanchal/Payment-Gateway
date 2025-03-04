import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import axios from "axios";

const OTPVerification = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const navigate = useNavigate(); // ✅ Initialize navigate

  const sendOTP = async () => {
    try {
      await axios.post("http://localhost:3000/sendotp", { phone });
      alert("OTP sent to your phone");
      setStep(2);
    } catch (error) {
      alert("Error sending OTP");
    }
  };

  const verifyOTP = async () => {
    try {
      const { data } = await axios.post("http://localhost:3000/verifyotp", {
        phone,
        otp,
      });

      alert("OTP verified! You can now proceed.");

      // ✅ Save token if received
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // ✅ Redirect to payment page
      navigate("/payment");
    } catch (error) {
      alert("Invalid OTP");
    }
  };

  return (
    <div>
      {step === 1 ? (
        <>
          <input
            type="text"
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={sendOTP}>Send OTP</button>
        </>
      ) : (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={verifyOTP}>Verify OTP</button>
        </>
      )}
    </div>
  );
};

export default OTPVerification;
