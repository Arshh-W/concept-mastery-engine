import Navbar from '../components/navbar.jsx';
import heroImage from "../assets/guy.webp";

import './landing.css';
export default function CodeConquer() {
    return (<div>
        <Navbar />
        <div className="hero">
            <div className="hero-left">
                <h1>
                    Master <span>Operating Systems</span> <br />
                    & <span>Database Systems</span>.
                </h1>

                <p>
                    Go from zero to hero, build hands-on projects and gain practical skills.
                </p>
                <button className="cta-btn">Explore Courses</button>
            </div>

            <div className="hero-right">
                <img src={heroImage} alt="hero" />
            </div>
        </div>


    </div>);
}