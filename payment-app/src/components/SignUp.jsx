import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(null); 
  const navigate = useNavigate();


  const sendOtp = async () => {
    if (!phone) {
      alert("Please enter a phone number.");
      return;
    }

    const formattedPhone = phone.startsWith("+91") ? phone : `+91${phone}`; 

    try {
      const { data } = await axios.post("http://localhost:3000/sendotp", {
        phone: formattedPhone,
      });

      setGeneratedOtp(data.otp);
      setOtpSent(true);
      alert("OTP sent to your phone number!");
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert(error.response?.data?.msg || "Failed to send OTP");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!name || !email || !phone || !password || !otp) {
      alert("All fields are required!");
      return;
    }

    if (otp !== generatedOtp) {
      alert("Invalid OTP! Please enter the correct OTP.");
      return;
    }

    try {
      await axios.post("http://localhost:3000/signup", {
        name,
        email,
        phone,
        password,
      });

      alert("Signup Successful!");
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.msg || "Signup Failed");
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSignUp}>
        <input
          type="text"
          placeholder="Full Name"
          className="auth-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="otp-container">
          <input
            type="text"
            placeholder="Phone Number"
            className="auth-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button
            type="button"
            className="otp-button"
            onClick={sendOtp}
            disabled={otpSent}
          >
            {otpSent ? "OTP Sent" : "Send OTP"}
          </button>
        </div>
        {otpSent && (
          <input
            type="text"
            placeholder="Enter OTP"
            className="auth-input"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
        )}
        <input
          type="password"
          placeholder="Password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="auth-button">
          Sign Up
        </button>
      </form>
      <p>
        Already have an account?{" "}
        <span onClick={() => navigate("/")} className="auth-link">
          Login here
        </span>
      </p>
    </div>
  );
};

export default SignUp;
