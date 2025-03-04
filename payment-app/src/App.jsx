import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PaymentForm from "./components/PaymentForm";
import LoginForm from "./components/Login";
import SignupForm from "./components/SignUp";
import OTPVerification from "./components/OtpVerification";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/" element={<LoginForm />} />
        <Route path="/payment" element={<PaymentForm />} />
        <Route path="/otp" element={<OTPVerification />} />
      </Routes>
    </Router>
  );
}

export default App;
