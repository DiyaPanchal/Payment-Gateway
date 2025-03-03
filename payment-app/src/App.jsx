import "./styles.css";
import PaymentForm from "./components/PaymentForm";

function App() {
  return (
    <div className="app-container">
      <div className="header-view" />
      <h1>Payment Gateway</h1>
      <PaymentForm />
    </div>
  );
}

export default App;
