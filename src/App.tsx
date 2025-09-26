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
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold text-white" to="/axion_digitaverse">
          <FaHome className="me-2 text-white" /> Axion Digitaverse
        </Link>
        <ul className="navbar-nav me-auto">
          <li className="nav-item">
            <Link className="nav-link fw-bold text-white" to="/wallet">
              <FaWallet className="me-2 text-white" /> Wallet
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link fw-bold text-white" to="/send">
              <FaPaperPlane className="me-2 text-white" /> Send acoin
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link fw-bold text-white" to="/chain">
              <FaSearch className="me-2 text-white" /> Explorer
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link fw-bold text-white" to="/ide">
              <FaCode className="me-2 text-white" /> Python IDE
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link fw-bold text-white" to="/agents">
              <FaUserSecret className="me-2 text-white" /> Agents
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link fw-bold text-white" to="/credits">
              <FaUserCircle className="me-2 text-white" /> Credits
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link fw-bold text-white" to="/axion-ai">
              🤖 Axion AI
            </Link>
          </li>
        </ul>
        <ul className="navbar-nav ms-auto">
          {!user && (
            <>
              <li className="nav-item">
                <Link className="nav-link fw-bold text-white" to="/signup">
                  <FaUser className="me-2 text-white" /> Sign Up
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link fw-bold text-white" to="/login">
                  <FaUser className="me-2 text-white" /> Login
                </Link>
              </li>
            </>
          )}
          {user && (
            <li className="nav-item d-flex align-items-center">
              <img
                src={user.profilePic ? `https://axion-digitaverse-3.onrender.com/api/profile-pic/${user.address}` : "/default-profile.png"}
                alt="Profile"
                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", marginRight: 8 }}
              />
              <span className="fw-bold text-white me-2">
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
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;