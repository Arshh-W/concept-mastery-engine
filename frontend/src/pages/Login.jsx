import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import { gameApi } from "../services/api";
import useGameStore from "../store/useGameStore"; 

import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  
  // Access the global setSession or a new setUser action if you add one
  const { setSession } = useGameStore();

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    try {
      // 1. Call the new centralized API
      const res = await gameApi.login({ 
        username: username, 
        password: password 
      });

      // 2. Handle the Token (Crucial for the Interceptor in api.js)
      // Assuming your backend returns { access_token: "...", user: {...} }
      const { access_token, user_Id, username: serverUsername } = res.data;
      
      localStorage.setItem("auth_token", access_token);

      // 3. Update Global State
      // If your store has a setUser, use that. Otherwise, we can store the ID.
      if (setSession) {
        setSession(user_Id); 
      }

      alert("Authentication Successful. Welcome back, Conqueror.");
      navigate("/roadmap");

    } catch (err) {
      console.error("Login Error:", err);
      // Check if it's a 401/403 or server down
      const errorMsg = err.response?.data?.detail || "Invalid credentials or Server Offline";
      alert(errorMsg);
    }
  };

  return (
    <div className="login-page-wrapper">
      <Navbar />
      <div className="auth-container">
        <div className="auth-card glass fade-in"> 
          <h1>Code Conquer</h1>
          <p className="subtitle">Learn and Improve</p>

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
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
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