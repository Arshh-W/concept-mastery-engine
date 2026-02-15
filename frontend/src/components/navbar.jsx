import './navbar.css';
import logoImage from "../assets/logo.png";
import { Link } from 'react-router-dom';

export default function Navbar() {
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
                        <span className="brand-main">Code</span>
                        <span className="brand-accent">Conquer</span>
                    </div>
                </div>

                <div className="nav-right">
                    
                    <Link to="/" className="badge-link">
                        Home
                    </Link>

                    <button  className="badge-link">
                        Courses
                        <span className="new-badge">New</span>
                    </button>

                    <Link to="/roadmap" className="badge-link">
                        Roadmap
                    </Link>

                    <button  className="badge-link">
                        About Us
                        
                    </button>

                    <button  className="badge-link">
                        Sign in
                        
                    </button>

                    <div className="dots">⋮</div>
                </div>


            </nav>
            <hr className="white-line" />

        </div>

    );
}
