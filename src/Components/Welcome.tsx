import { useUser } from "../UserContext";
import { FaCopy } from "react-icons/fa";
import { QRCodeCanvas } from "qrcode.react";
import { useState, useRef } from "react";

function shortAddress(address: string) {
  if (!address) return "";
  return address.slice(0, 8) + "..." + address.slice(-4);
}

function WelcomePage() {
  const { user, setUser } = useUser();
  const [copied, setCopied] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    if (user?.address) {
      navigator.clipboard.writeText(user.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleUpload = async () => {
    if (!user || !fileInputRef.current?.files?.[0]) return;
    const formData = new FormData();
    formData.append("address", user.address);
    formData.append("profilePic", fileInputRef.current.files[0]);
    const res = await fetch("https://axion-digitaverse-3.onrender.com/api/upload-profile-pic", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      // Update user context with new profilePic
      setUser({ ...user, profilePic: data.profilePic });
      setShowPopup(false);
    }
  };

  const profilePicUrl = user?.profilePic
    ? `https://axion-digitaverse-3.onrender.com/api/profile-pic/${user.address}?t=${Date.now()}`
    : "/default-profile.png";

  return (
    <div className="d-flex justify-content-center align-items-center"
         style={{ minHeight: "calc(100vh - 64px)" }}>
      <div className="card shadow w-100"
           style={{ maxWidth: 600, background: "rgba(255,255,255,0.15)", minHeight: 300 }}>
        <h1 className="text-center mb-2" style={{ color: "#1c92d2", fontWeight: 700, fontSize: 28 }}>
          Enjoy Your Web 3.0 with Axion Digitaverse Infrastructure
        </h1>
        <p className="text-center fw-bold text-white fs-6" style={{ maxWidth: 500, margin: "0 auto" }}>
          Welcome to the future of decentralized finance, identity, and smart contracts.
        </p>
        {user && (
          <div className="text-center mt-3">
            <img
              src={profilePicUrl}
              alt="Profile"
              style={{ width: 60, height: 60, borderRadius: "50%", cursor: "pointer" }}
              onClick={() => setShowPopup(true)}
            />
            <h5 className="mt-2 text-white fw-bold" style={{ fontSize: 18 }}>
              Welcome, {user.username}!
            </h5>
            <div className="d-flex justify-content-center align-items-center mt-2">
              <span className="text-white fw-bold me-2" style={{ fontSize: 14 }}>
                Address: {shortAddress(user.address)}
              </span>
              <span className="me-2" style={{ cursor: "pointer" }} onClick={handleCopy}>
                <FaCopy className="text-info" />
              </span>
              {copied && <span className="text-success fw-bold">Copied!</span>}
            </div>
            <div className="mt-2">
              <QRCodeCanvas value={user.address} size={60} bgColor="#181c2f" fgColor="#1c92d2" />
              <div className="fw-bold text-white mt-1" style={{ fontSize: 12 }}>
                Scan to send acoin
              </div>
            </div>
            <div className="fw-bold text-white mt-2" style={{ fontSize: 14 }}>
              Balance: {user.balance} acoin
            </div>
          </div>
        )}
      </div>
      {user && showPopup && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" style={{ background: "rgba(0,0,0,0.5)", zIndex: 9999 }}>
          <div className="card p-4" style={{ maxWidth: 350 }}>
            <h5 className="fw-bold text-white mb-3">Profile Pic Options</h5>
            <button className="btn btn-secondary w-100 mb-2 fw-bold" onClick={() => setShowPopup(false)}>
              View Profile Pic
            </button>
            <input type="file" ref={fileInputRef} className="form-control mb-2" />
            <button className="btn btn-primary w-100 fw-bold" onClick={handleUpload}>
              Upload/Change Profile Pic
            </button>
            <button className="btn btn-outline-danger w-100 mt-2 fw-bold" onClick={() => setShowPopup(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WelcomePage;