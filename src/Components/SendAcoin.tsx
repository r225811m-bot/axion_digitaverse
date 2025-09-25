import { useState } from "react";
import { useUser } from "../UserContext";
import { FaPaperPlane, FaWallet } from "react-icons/fa";

function SendAcoin() {
  const { user } = useUser();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");

  const send = async () => {
    if (!user) return;
    setStatus("Sending...");
    const res = await fetch("http://localhost:5000/api/transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Address": user.address,
        "X-Token": user.token,
      },
      body: JSON.stringify({ from: user.address, to, amount }),
    });
    const data = await res.json();
    setStatus(data.block ? "Sent!" : data.error || "Failed");
  };

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <h2 className="fw-bold text-white"><FaPaperPlane className="me-2 text-white" />Send acoin</h2>
        <p className="fw-bold text-white">Please sign in to send acoin.</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <h2 className="mb-4 fw-bold text-white text-center">
        <FaPaperPlane className="me-2 text-white" /> Send acoin
      </h2>
      <div className="card shadow mx-auto p-4" style={{ maxWidth: 400, background: "rgba(30,40,60,0.95)" }}>
        <div className="mb-3">
          <label className="form-label fw-bold text-white">
            <FaWallet className="me-2 text-white" />To address
          </label>
          <input className="form-control fw-bold text-white" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label fw-bold text-white">Amount</label>
          <input className="form-control fw-bold text-white" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <button className="btn btn-success fw-bold w-100" onClick={send}>
          <FaPaperPlane className="me-2" />Send
        </button>
        {status && <div className="alert alert-info mt-2 fw-bold">{status}</div>}
      </div>
    </div>
  );
}

export default SendAcoin;