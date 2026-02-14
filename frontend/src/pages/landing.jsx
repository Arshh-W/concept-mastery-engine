import dbms from "../assets/dbms.png";
import os from "../assets/os.png";
import './landing.css'
export default function CodeConquer() {
  return (
    <div className="container">

      <div className="navbar">
        <h1 className="logo">CodeConquer</h1>
        <p className="tagline">Learn. Code. Conquer.</p>
      </div>

      <div
        className="hero"
      >


        <h1>Master OS & DBMS</h1>
        <h2>Through Missions and Boss Battles</h2>

        <p id="yo">
          Complete challenges. Earn XP. Conquer concepts.
        </p>

        <div className="hero-buttons">
          <button className="primary-btn">Start Mission</button>
          <button className="secondary-btn">Roadmap</button>
        </div>
      </div>

      <div className="features">

        <div className="feature-card">
          <img src={os} alt="Operating Systems" />
          <h3>Operating Systems</h3>
          <p>
            Master processes, scheduling, memory management,
            synchronization and system design fundamentals.
          </p>
        </div>

        <div className="feature-card">
          <img src={dbms} alt="DBMS" />
          <h3>Database Systems</h3>
          <p>
            Learn indexing, normalization, transactions,
            concurrency control and query optimization.
          </p>
        </div>

      </div>

      <footer className="footer">
          <div className="contact-info">
            <h3>Need Backup?</h3>
            <p>Please reach out to the masters.</p>
            <p>Contact no.= [Likh dio jo likhna hai]</p>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 CodeConquer. All Rights Reserved.</p>
          </div>
      </footer>


    </div>
  );

}
