import { useUser } from "../UserContext";
import { useEffect, useState } from "react";
import { FaWallet, FaCopy } from "react-icons/fa";

function Wallet() {
  const { user, setUser } = useUser();
  const [balance, setBalance] = useState(user?.balance ?? 0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Always fetch the latest balance from backend
    const fetchBalance = async () => {
      if (user?.address) {
        const res = await fetch(`http://localhost:5000/api/wallet/${user.address}`);
        const data = await res.json();
        setBalance(data.balance);
        // Optionally update user context with new balance
        setUser((prev: any) => prev ? { ...prev, balance: data.balance } : prev);
      }
    };
    fetchBalance();
    // Optionally, poll every 10 seconds:
    // const interval = setInterval(fetchBalance, 10000);
    // return () => clearInterval(interval);
  }, [user?.address, setUser]);

  const handleCopy = () => {
    if (user?.address) {
      navigator.clipboard.writeText(user.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!user) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning fw-bold text-center">
          Please log in to view your wallet.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="card shadow mx-auto p-4" style={{ maxWidth: 400 }}>
        <h2 className="fw-bold text-white text-center mb-4">
          <FaWallet className="me-2 text-white" /> Wallet
        </h2>
        <div className="fw-bold text-white mb-2">
          Address: {user.address.slice(0, 8) + "..." + user.address.slice(-4)}
          <span className="ms-2" style={{ cursor: "pointer" }} onClick={handleCopy}>
            <FaCopy className="text-info" />
          </span>
          {copied && <span className="text-success fw-bold ms-2">Copied!</span>}
        </div>
        <div className="fw-bold text-white mb-2">
          Username: {user.username}
        </div>
        <div className="fw-bold text-white mb-2">
          Balance: <span className="text-success">{balance}</span> acoin
        </div>
      </div>
    </div>
  );
}

export default Wallet;