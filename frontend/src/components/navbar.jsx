import './navbar.css';
import logoImage from "../assets/logo.png";
import { Link } from 'react-router-dom';
import { useState } from 'react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <nav className="navbar">

                <div className="nav-left">
                    <div 
                        className={`hamburger ${isOpen ? "active" : ""}`}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        ☰
                    </div>

                    <div className="logo-circle">
                        <img src={logoImage} alt="hero" />
                    </div>

                    <div className="brand">
                        <Link to="/" className="brand-link">
                            <span className="brand-main">Code</span>
                            <span className="brand-accent">Conquer</span>
                        </Link>
                    </div>
                </div>

                <div className={`nav-right ${isOpen ? "open" : ""}`}>
                    
                    <Link to="/" className="badge-link" onClick={() => setIsOpen(false)}>
                        Home
                    </Link>
                    
                    <Link to="/roadmap" className="badge-link" onClick={() => setIsOpen(false)}>
                        Courses
                        <span className="new-badge">New</span>
                    </Link>

                    <Link to="/about" className="badge-link" onClick={() => setIsOpen(false)}>
                        About us
                    </Link>

                    <Link to="/signup" className="badge-link" onClick={() => setIsOpen(false)}>
                        Sign-in/Sign-up
                    </Link>

                    <div className="dots">⋮</div>
                </div>

            </nav>
            <hr className="white-line" />
        </div>
    );
}
