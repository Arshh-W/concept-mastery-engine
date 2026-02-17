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
