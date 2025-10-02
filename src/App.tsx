
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { UserProvider, useUser } from "./UserContext";
import Wallet from "./Components/Wallet";
import SendAcoin from "./Components/SendAcoin";
import PythonIDE from "./Components/PythonIDE";
import Credits from "./Components/Credits";
import SignUpForm from "./Components/SignUpForm";
import LoginForm from "./Components/LogInForm";
import Explorer from "./Components/Explorer";
import WelcomePage from "./Components/Welcome";
import Agents from "./Components/Agents";
import AxionAI from "./Components/AxionAI";
import AxionAIDashboard from "./Components/AxionAIDashboard";
import Hosting from "./Components/Hosting";
import {
  FaWallet,
  FaPaperPlane,
  FaCode,
  FaUserCircle,
  FaUser,
  FaSearch,
  FaHome,
  FaUserSecret,
  FaSignOutAlt,
  FaCopy,
  FaComments,
  FaCloud,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./App.css";

// Shorten address for display
function shortAddress(address: string) {
  if (!address) return "";
  return address.slice(0, 8) + "..." + address.slice(-4);
}

// Navbar (with all links)
function Navbar() {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleLogout = () => {
    setUser(null);
    navigate("/login");
  };

  const handleCopy = () => {
    if (user?.address) {
      navigator.clipboard.writeText(user.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4 navbar-custom">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold text-white navbar-brand-custom" to="/axion_digitaverse">
          <FaHome className="me-2 text-white" /> Axion Digitaverse
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white nav-link-custom" to="/wallet">
                <FaWallet className="me-2 text-white" /> Wallet
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white nav-link-custom" to="/send">
                <FaPaperPlane className="me-2 text-white" /> Send acoin
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white nav-link-custom" to="/chain">
                <FaSearch className="me-2 text-white" /> Explorer
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white nav-link-custom" to="/ide">
                <FaCode className="me-2 text-white" /> Python IDE
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white nav-link-custom" to="/agents">
                <FaUserSecret className="me-2 text-white" /> Agents
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white nav-link-custom" to="/credits">
                <FaUserCircle className="me-2 text-white" /> Credits
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white nav-link-custom" to="/axion-ai">
                🤖 Axion AI
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white nav-link-custom" to="/chat">
                <FaComments className="me-2 text-white" /> Chat
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white nav-link-custom" to="/hosting">
                <FaCloud className="me-2 text-white" /> Hosting
              </Link>
            </li>
          </ul>
          <ul className="navbar-nav ms-auto">
            {!user && (
              <>
                <li className="nav-item">
                  <Link className="nav-link fw-bold text-white nav-link-custom" to="/signup">
                    <FaUser className="me-2 text-white" /> Sign Up
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link fw-bold text-white nav-link-custom" to="/login">
                    <FaUser className="me-2 text-white" /> Login
                  </Link>
                </li>
              </>
            )}
            {user && (
              <li className="nav-item user-info-container">
                <img
                  src={user.profilePic ? `https://axion-digitaverse-3.onrender.com/api/profile-pic/${user.address}` : "/default-profile.png"}
                  alt="Profile"
                  className="profile-pic-navbar"
                />
                <span className="address-navbar">
                  {shortAddress(user.address)}
                </span>
                <span style={{ cursor: "pointer" }} onClick={handleCopy}>
                  <FaCopy className="text-info" />
                </span>
                {copied && <span className="text-success fw-bold ms-2">Copied!</span>}
                <button className="btn btn-link text-white ms-2" onClick={handleLogout} title="Logout">
                  <FaSignOutAlt />
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/axion_digitaverse" element={<WelcomePage />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/send" element={<SendAcoin />} />
          <Route path="/chain" element={<Explorer />} />
          <Route path="/ide" element={<PythonIDE />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/signup" element={<SignUpForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/axion-ai" element={<AxionAI />} />
          <Route path="/axion-ai-dashboard" element={<AxionAIDashboard />} />
          
          <Route path="/hosting" element={<Hosting />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
