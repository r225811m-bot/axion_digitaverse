import { useUser } from "../UserContext";
import { useEffect, useState, useCallback } from "react";
import { FaWallet, FaCopy, FaServer } from "react-icons/fa";
import "../App.css";

function Wallet() {
  const { user, setUser } = useUser();
  const [balance, setBalance] = useState(user?.balance ?? 0);
  const [isMiner, setIsMiner] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("");

  const fetchWalletData = useCallback(async () => {
    if (user?.address) {
      try {
        const res = await fetch(`https://axion-digitaverse-3.onrender.com/api/wallet/${user.address}`);
        const data = await res.json();
        if (res.ok) {
          setBalance(data.balance);
          setIsMiner(data.is_miner);
          setUser((prev) => prev ? { ...prev, balance: data.balance, isMiner: data.is_miner } : prev);
        } else {
          setStatus(data.error || "Failed to fetch wallet data");
        }
      } catch (error) {
        console.error("Fetch wallet data error:", error);
        setStatus("An error occurred while fetching wallet data.");
      }
    }
  }, [user?.address, setUser]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handleCopy = () => {
    if (user?.address) {
      navigator.clipboard.writeText(user.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const registerAsMiner = async () => {
    if (!user) return;
    setStatus("Registering...");
    try {
      const res = await fetch("https://axion-digitaverse-3.onrender.com/api/register-miner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: user.address }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("Successfully registered as a miner!");
        // Refresh wallet data to show new status
        fetchWalletData();
      } else {
        setStatus(data.error || "Failed to register as miner");
      }
    } catch (error) {
        console.error("Miner registration error:", error);
        setStatus("An error occurred during miner registration.");
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
          Balance: <span className="wallet-balance">{balance.toFixed(4)}</span> acoin
        </div>
        <div className="wallet-info">
          Miner Status: 
          {isMiner ? 
            <span className="badge bg-success ms-2">Active Miner</span> : 
            <span className="badge bg-secondary ms-2">Not a Miner</span>
          }
        </div>
        {!isMiner && (
          <div className="mt-4">
            <button className="btn btn-primary fw-bold w-100" onClick={registerAsMiner}>
              <FaServer className="me-2" />Register as a Miner
            </button>
            <div className="form-text text-light mt-2">Become a miner to help secure the network and earn gas fees from transactions. (Requires a small gas fee).</div>
          </div>
        )}
        {status && <div className={`alert mt-3 ${status.startsWith("Successfully") ? 'alert-success' : 'alert-danger'}`}>{status}</div>}
      </div>
    </div>
  );
}

export default Wallet;
