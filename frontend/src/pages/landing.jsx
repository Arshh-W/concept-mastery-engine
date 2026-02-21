import Navbar from "../components/navbar.jsx";
import hero1Image from "../assets/guy1.png";
import { motion } from "framer-motion";
import { Link } from 'react-router-dom';
import "./landing.css";

export default function CodeConquer() {
  return (
    <div>
      <Navbar />

      <motion.div
        className="page-wrapper"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.5 }}
      >
        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-left">
            <h1>
              Conquer <span>Core Concepts</span> <br />
              Build Real Skills.
            </h1>

            <p>
              Go from zero to hero, build hands-on projects and gain practical skills.
            </p>

            <div className="hero-actions">
            <Link to="/roadmap" className="cta-btn">
              Explore Courses
            </Link>
            
            <p className="hero-signin-note">
              Already a member? <Link to="/login">Sign In</Link>
            </p>
          </div>
          </div>

          <div className="hero-right">
            <div className="image-wrapper">
              <img src={hero1Image} alt="hero" />

              <div className="comment c5" style={{ animationDelay: "0.2s" }}>
                😍 Why Code Conquer?
              </div>

              <div className="comment c1" style={{ animationDelay: "0.8s" }}>
                🚀 Complete Missions, Not Just Lessons
              </div>

              <div className="comment c2" style={{ animationDelay: "1.4s" }}>
                🎯 Master Core Concepts Deeply
              </div>

              <div className="comment c3" style={{ animationDelay: "2s" }}>
                ⚔️ Level Up Your Skills
              </div>

              <div className="comment c4" style={{ animationDelay: "2.6s" }}>
                🏆 Build Interview-Ready Confidence
              </div>
            </div>
          </div>
        </section>
        {/* FEATURES / GAME MECHANICS SECTION */}
      <section className="engine-features">
        <div className="section-label">System Modules</div>
        <h2 className="glitch-text">Engine Capabilities</h2>
        
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">📂</div>
            <h3>Live Kernel Sandbox</h3>
            <p>Don't just read about File Systems. Interact with a simulated Kernel in real-time. Mount drives and manage permissions.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <h3>Query Arena</h3>
              <p>Battle through SQL optimization challenges. Write queries to extract data from a "Corrupted Database" to save the system.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <h3>CPU Scheduling Sim</h3>
              <p>Visualize Round Robin and SJF algorithms. Balance the load of a high-performance gaming server without crashing.</p>
            </div>
          </div>
        </section>

        {/* STATS / PROGRESSION SECTION */}
        <section className="stats-bar">
          <div className="stat-card">
            <span className="stat-number">15+</span>
            <span className="stat-desc">Levels Unlocked</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">500+</span>
            <span className="stat-desc">Terminal Commands</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">0</span>
            <span className="stat-desc">Boring Lectures</span>
          </div>
        </section>
        
        {/* CONTACT SECTION */}
        <section className="contact-section">
          <h2>Connect With Us</h2>

          <p className="contact-sub">
            Have feedback, ideas, or questions? We'd love to hear from you.
          </p>

          <div className="contact-container">
            <div className="contact-card">
              <h3>💬 Feedback</h3>
              <p>Help us improve CodeConquer by sharing your thoughts.</p>
              
              <Link to="/feedback" className="outline-btn">Give Feedback</Link>

            </div>

            <div className="contact-card">
              <h3>📩 Contact Us</h3>
              <p>Reach out for support, collaborations, or queries.</p>
              <Link to="/contact" className="outline-btn">Contact Team</Link>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
