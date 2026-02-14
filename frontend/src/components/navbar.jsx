import './navbar.css';
export default function Navbar() {
    return (
        <div>
            <nav className="navbar">

                <div className="nav-left">
                    <div className="hamburger">
                        ☰
                    </div>

                    <div className="logo-circle">
                        <span>⟡</span>
                    </div>

                    <div className="brand">
                        <span className="brand-main">Code</span>
                        <span className="brand-accent">Conquer</span>
                    </div>
                </div>

                <div className="nav-right">
                    <a href="#">Interview Practice</a>

                    <a href="#" className="badge-link">
                        Courses
                        <span className="new-badge">New</span>
                    </a>

                    <a href="#">Sign In</a>

                    <div className="dots">⋮</div>
                </div>


            </nav>
            <hr className="white-line" />

        </div>

    );
}
