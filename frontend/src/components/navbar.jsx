import './navbar.css';
import logoImage from "../assets/logo.png";
import { Link } from 'react-router-dom';
import Hamburger from './Hamburger.jsx';
import { useState } from 'react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
    setIsOpen(!isOpen);
};
    return (
        <div>
            <nav className="navbar">

                <div className="nav-left">
                    <div className="hamburger">
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

                <div className="nav-right">
                    
                    <Link to="/" className="badge-link">
                        Home
                    </Link>
                    
                    <Link to="/roadmap" className="badge-link">
                        Courses
                        <span className="new-badge">New</span>
                    </Link>

                    <Link to="/about" className="badge-link">
                        About us
                    </Link>

                    <Link to="/signup" className="badge-link">
                        Sign-in/Sign-up
                    </Link>

                    <div className="dots">⋮</div>
                </div>


            </nav>
            <hr className="white-line" />

        </div>

    );
}
