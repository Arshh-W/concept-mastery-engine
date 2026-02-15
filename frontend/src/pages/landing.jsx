import Navbar from '../components/navbar.jsx';
import heroImage from "../assets/guy.webp";

import './landing.css';
export default function CodeConquer() {
    return (<div>
        <Navbar />
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
                    <img src={heroImage} alt="hero" />

                    <div className="comment c1" style={{ animationDelay: "0.2s" }}>
                        🚀 Complete Missions, Not Just Lessons
                    </div>

                    <div className="comment c2" style={{ animationDelay: "0.8s" }}>
                        🎯 Master Core Concepts Deeply
                    </div>

                    <div className="comment c3" style={{ animationDelay: "1.4s" }}>
                        ⚔️ Level Up Your Skills
                    </div>

                    <div className="comment c4" style={{ animationDelay: "2s" }}>
                        🏆 Build Interview-Ready Confidence
                    </div>

                </div>

            </div>
        </div>


    </div>);
}