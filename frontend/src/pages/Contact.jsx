import { motion } from "framer-motion";
import "./Feedback.css";

export default function Contact() {
  return (
    <motion.div 
      className="form-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="form-container">
        <h1>Contact <span>The Core</span></h1>
        <p>Direct line to the CodeConquer development team.</p>
        
        <form className="cyber-form">
          <div className="input-row">
            <div className="input-group">
              <label>Name</label>
              <input type="text" placeholder="Your Name" />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input type="email" placeholder="email@xyz.com" />
            </div>
          </div>
          
          <div className="input-group">
            <label>Subject</label>
            <select>
              <option>General Query</option>
              <option>Bug Report</option>
              <option>Collaboration</option>
            </select>
          </div>
          
          <div className="input-group">
            <label>Detailed Intel</label>
            <textarea placeholder="How can we help?"></textarea>
          </div>
          
          <button type="submit" className="submit-btn">Initialize Contact</button>
        </form>
      </div>
    </motion.div>
  );
}