import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import { gameApi } from "../services/api";
import "./Login.css";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    setError("");
    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      await gameApi.register({ username, password });
      navigate("/login");
    } catch (err) {
      console.error("Signup Error:", err);
      const msg = err.response?.data?.error || "Signup failed. Try a different username.";
      setError(msg);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <Navbar />
      <div className="auth-container">
        <div className="auth-card glass fade-in">
          <h1>Create Account</h1>
          <p className="subtitle">Join and conquer it!</p>

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
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            />
          </div>

          <button className="signup-btn" onClick={handleSignup}>
            Sign Up
          </button>

          <p className="footer-text">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;