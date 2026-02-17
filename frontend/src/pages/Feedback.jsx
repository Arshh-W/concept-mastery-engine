import Navbar from "../components/navbar.jsx";
import { useState } from "react";
import { motion } from "framer-motion";
import "./Feedback.css"; 

export default function Feedback() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  return (
    <motion.div className="form-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Navbar/>
      <div className="form-container">
        <h1>Transmit <span>Feedback</span></h1>
        
        <form className="cyber-form">
          <div className="input-group">
            <label>User Satisfaction Level</label>
            <div className="star-rating">
              {[...Array(5)].map((star, index) => {
                index += 1;
                return (
                  <button
                    type="button"
                    key={index}
                    className={index <= (hover || rating) ? "star-btn on" : "star-btn off"}
                    onClick={() => setRating(index)}
                    onMouseEnter={() => setHover(index)}
                    onMouseLeave={() => setHover(rating)}
                  >
                    <span className="star">&#9733;</span>
                  </button>
                );
              })}
            </div>
            <p className="rating-text">Level {rating} / 5</p>
          </div>

          <div className="input-group">
            <label>Message</label>
            <textarea placeholder="Type your transmission here..."></textarea>
          </div>
          
          <button type="submit" className="submit-btn">Submit!</button>
        </form>
      </div>
    </motion.div>
  );
}