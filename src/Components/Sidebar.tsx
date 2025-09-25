import { Link } from "react-router-dom";
import {
  FaUserSecret,
  FaMoneyBillWave,
  FaInfoCircle,
} from "react-icons/fa";

function Sidebar() {
  return (
    <div
      className="bg-dark text-white p-3"
      style={{
        minHeight: "100vh",
        width: 220,
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        borderRight: "2px solid #1c92d2",
      }}
    >
      <h5 className="mb-4 text-center">Management</h5>
      <ul className="nav flex-column">
        <li className="nav-item mb-2">
          <Link className="nav-link text-white d-flex align-items-center" to="/agents">
            <FaUserSecret className="me-2" /> Agents
          </Link>
        </li>
        <li className="nav-item mb-2">
          <Link className="nav-link text-white d-flex align-items-center" to="/register-agent">
            <FaUserSecret className="me-2" /> Register Agent
          </Link>
        </li>
        <li className="nav-item mb-2">
          <Link className="nav-link text-white d-flex align-items-center" to="/agent-deposit">
            <FaMoneyBillWave className="me-2" /> Agent Deposit
          </Link>
        </li>
        <li className="nav-item mb-2">
          <Link className="nav-link text-white d-flex align-items-center" to="/about">
            <FaInfoCircle className="me-2" /> About
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;