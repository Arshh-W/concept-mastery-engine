import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import { gameApi } from "../services/api"; // Connect to centralized API
import "./Login.css";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    // Basic validation to prevent unnecessary API calls
    if (!username || !password) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      // 1. Call the backend via gameApi
      await gameApi.register({ 
        username: username, 
        password: password 
      });

      alert("Account created! Please login to begin your conquest.");
      navigate("/login");
      
    } catch (err) {
      console.error("Signup Error:", err);
      // Try to get specific error message from Python backend (e.g., "Username taken")
      const errorMsg = err.response?.data?.detail || "Signup failed. Try a different username.";
      alert(errorMsg);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <Navbar />
      <div className="auth-container">
        <div className="auth-card glass fade-in">
          <h1>Create Account</h1>
          <p className="subtitle">Join and conquer it!</p>

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
              autoComplete="new-password"
              onKeyDown={(e) => e.key === 'Enter' && handleSignup()}
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