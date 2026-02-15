import Navbar from '../components/navbar.jsx';
import hero1Image from "../assets/guy1.png";
import { motion } from 'framer-motion';

import './landing.css';
export default function CodeConquer() {
    return (<div>
        <Navbar />
        <motion.div
        initial={{ opacity: 0, x: -20 }}    
        animate={{ opacity: 1, x: 0 }}      
        exit={{ opacity: 0, x: 20 }}        
        transition={{ duration: 0.5 }}      
        >
        <div className="hero">
            <div className="hero-left">
                <h1>
                    Conquer <span>Core Concepts</span> <br />
                    Build Real Skills.
                </h1>


                <p>
                    Go from zero to hero, build hands-on projects and gain practical skills.
                </p>
                <button className="cta-btn">Explore Courses</button>
            </div>

            <div className="hero-right">
                <div className="image-wrapper">
                    
                    <img src={hero1Image} alt="hero" />
                    <div className="comment c5 primary" style={{ animationDelay: "0.2s" }}>😍 Why Code Conquer?</div>


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
        </div>
         </motion.div>


    </div>);
}