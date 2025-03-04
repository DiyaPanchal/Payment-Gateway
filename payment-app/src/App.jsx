import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PaymentForm from "./components/PaymentForm";
import LoginForm from "./components/Login";
import SignupForm from "./components/SignUp";

function App() {
  return (
    <Router>
     
        <Routes>
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/" element={<LoginForm />} />
          <Route path="/payment" element={<PaymentForm />} />
        </Routes>
    </Router>
  );
}

export default App;
