import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/navbar.jsx";
import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();


  const handleLogin = async () => {
    try {
      const res = await loginUser({ username, password });
      setUser({
        id: res.data.user_Id,
        username: res.data.username
      });
      navigate("/mentor");
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div>
        <Navbar />
      <div className="auth-container">
        {/* We wrap everything in a card/box so it's not loose */}
        <div className="auth-card glass fade-in"> 
          <h1>Code Conquer</h1>
          <p className="subtitle">Learn and Improve</p>

          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleLogin}>Login</button>

          <p className="footer-text">
            New here? <Link to="/signup">Create account</Link>
          </p>
        </div>
      </div>
      </div>
    );
  };

export default Login;
