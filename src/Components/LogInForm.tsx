import { useUser } from "../UserContext";
import { useState } from "react";
import { FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function LoginForm() {
  const { setUser } = useUser();
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: any) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicKey, privateKey }),
    });
    const data = await res.json();
    if (res.ok) {
      setUser(data.user); // <-- includes balance
      navigate("/wallet");
    } else {
      setError(data.message || "Login failed");
    }
  };

  return (
    <div className="container py-5">
      <form className="card shadow mx-auto p-4" style={{ maxWidth: 400 }} onSubmit={handleLogin}>
        <h2 className="fw-bold text-white text-center">
          <FaUser className="me-2 text-white" /> Login
        </h2>
        <input
          className="form-control mb-3 fw-bold text-white"
          placeholder="Public Key"
          value={publicKey}
          onChange={e => setPublicKey(e.target.value)}
          required
        />
        <input
          className="form-control mb-3 fw-bold text-white"
          placeholder="Private Key"
          value={privateKey}
          onChange={e => setPrivateKey(e.target.value)}
          required
        />
        <button className="btn btn-primary w-100 fw-bold" type="submit">Login</button>
        {error && <div className="alert alert-danger mt-2 fw-bold">{error}</div>}
      </form>
    </div>
  );
}

export default LoginForm;