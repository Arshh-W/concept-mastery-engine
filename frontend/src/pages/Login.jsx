import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import { gameApi } from "../services/api";
import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      const res = await gameApi.login({ username, password });
      const { access_token } = res.data;
      localStorage.setItem("auth_token", access_token);
      navigate("/roadmap");
    } catch (err) {
      console.error("Login Error:", err);
      const msg = err.response?.data?.error || "Invalid credentials or server offline.";
      setError(msg);
    }
  };

  return (
    <div className="login-page-wrapper">
      <Navbar />
      <div className="auth-container">
        <div className="auth-card glass fade-in">
          <h1>Code Conquer</h1>
          <p className="subtitle">Learn and Improve</p>

          {error && <p style={{ color: "#ff4d4d", marginBottom: "10px", fontSize: "14px" }}>{error}</p>}

          <div className="input-group">
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <button className="login-btn" onClick={handleLogin}>
            Login
          </button>

          <p className="footer-text">
            New here? <Link to="/signup">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;