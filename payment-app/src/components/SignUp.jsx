import { useNavigate } from "react-router-dom";
import React, { useState } from "react";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    balance: "", 
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: name === "balance" ? value.replace(/\D/g, "") : value,
    });
  };

  const handleSignUp = (e) => {
    e.preventDefault();

    const { name, email, password, balance } = formData;

    if (!name || !email || !password || balance === "") {
      alert("All fields are required!");
      return;
    }

    localStorage.setItem(
      "signupData",
      JSON.stringify({ name, email, password, balance })
    );

    navigate("/otp");
  };

  return (
    <div className="auth-container">
      <h2>Create Account</h2>

      <form onSubmit={handleSignUp}>
        <input
          type="text"
          name="name"
          placeholder="Your username"
          value={formData.name}
          onChange={handleChange}
          className="auth-input"
        />

        <input
          type="email"
          name="email"
          placeholder="Your email"
          value={formData.email}
          onChange={handleChange}
          className="auth-input"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="auth-input"
        />

        <input
          type="text"
          name="balance"
          placeholder="Add balance"
          value={formData.balance}
          onChange={handleChange}
          className="auth-input"
        />

        <div className="terms-container">
          <input type="checkbox" id="terms" required />
          <label htmlFor="terms">I accept the terms and privacy policy</label>
        </div>

        <button type="submit" className="auth-button">
          Sign up
        </button>
      </form>
    </div>
  );
};

export default Signup;
