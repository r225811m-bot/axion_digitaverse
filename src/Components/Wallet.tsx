import { useUser } from "../UserContext";
import { useEffect, useState } from "react";
import { FaWallet, FaCopy } from "react-icons/fa";
import "../App.css";

function Wallet() {
  const { user, setUser } = useUser();
  const [balance, setBalance] = useState(user?.balance ?? 0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Always fetch the latest balance from backend
    const fetchBalance = async () => {
      if (user?.address) {
        const res = await fetch(`https://axion-digitaverse-3.onrender.com/api/wallet/${user.address}`);
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
    <div className="container wallet-container">
      <div className="card shadow wallet-card">
        <h2 className="wallet-title">
          <FaWallet className="me-2 text-white" /> Wallet
        </h2>
        <div className="wallet-info">
          Address: {user.address.slice(0, 8) + "..." + user.address.slice(-4)}
          <span className="ms-2" style={{ cursor: "pointer" }} onClick={handleCopy}>
            <FaCopy className="text-info" />
          </span>
          {copied && <span className="text-success fw-bold ms-2">Copied!</span>}
        </div>
        <div className="wallet-info">
          Username: {user.username}
        </div>
        <div className="wallet-info">
          Balance: <span className="wallet-balance">{balance}</span> acoin
        </div>
      </div>
    </div>
  );
}

export default Wallet;
