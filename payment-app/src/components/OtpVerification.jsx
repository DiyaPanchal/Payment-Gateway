import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const OTPVerification = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [signupData, setSignupData] = useState(null);

  useEffect(() => {
    const storedData = localStorage.getItem("signupData");
    if (storedData) {
      setSignupData(JSON.parse(storedData));
    } else {
      alert("No signup data found! Please sign up again.");
      navigate("/signup");
    }
  }, [navigate]);

  const sendOTP = async () => {
    if (!phone) {
      alert("Please enter a phone number");
      return;
    }
    let formattedPhone = phone.trim().replace(/^0+/, "");

    if (!formattedPhone.startsWith("+91")) {
      formattedPhone = `+91${formattedPhone}`;
    }

    try {
      await axios.post("http://localhost:3000/sendotp", {
        phone: formattedPhone,
      });
      alert(`OTP sent to ${formattedPhone}`);

      const updatedSignupData = { ...signupData, phone: formattedPhone };
      setSignupData(updatedSignupData);
      localStorage.setItem("signupData", JSON.stringify(updatedSignupData));

      setStep(2);
    } catch (error) {
      alert("Error sending OTP");
    }
  };


  const verifyOTP = async () => {
    try {
      const otpCode = otp.join("");  
      const storedData = JSON.parse(localStorage.getItem("signupData"));

      if (!storedData?.phone) {
        alert("Phone number not found. Please restart the signup process.");
        navigate("/signup");
        return;
      }

      const { data } = await axios.post("http://localhost:3000/verifyotp", {
        phone: storedData.phone,
        otp: otpCode,
      });

      if (data.success) {
        alert("OTP verified! Completing signup...");

        await axios.post("http://localhost:3000/signup", storedData);

        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        navigate("/");
      } else {
        alert("Invalid OTP. Please try again.");
      }
    } catch (error) {
      alert("OTP verification failed");
    }
  };


  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    let newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  return (
    <div className="otp-container">
      {step === 1 ? (
        <div className="phone-input">
          <h2>Enter Phone Number</h2>
          <input
            type="text"
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="phone-field"
          />
          <button className="send-btn" onClick={sendOTP}>
            Send OTP
          </button>
        </div>
      ) : (
        <div className="otp-input">
          <h2>Enter Code</h2>
          <p>We’ve sent an SMS with an activation code to your phone</p>
          <div className="otp-boxes">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(e, index)}
                className="otp-field"
              />
            ))}
          </div>
          <button className="verify-btn" onClick={verifyOTP}>
            Verify OTP
          </button>
        </div>
      )}
    </div>
  );
};

export default OTPVerification;
