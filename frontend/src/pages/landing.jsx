import bg from "../assets/bg.png";
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
      style={{ backgroundImage: `url(${bg})` }}
    >
      <h1>Master OS & DBMS</h1>
      <h2>Through Missions and Boss Battles</h2>

      <p>
        Complete challenges. Earn XP. Conquer concepts.
      </p>

      <div className="hero-buttons">
        <button className="primary-btn">Start Mission</button>
        <button className="secondary-btn">Roadmap</button>
      </div>
    </div>

    <div className="features">
      {/* isko badme krenge */}
    </div>

  </div>
);

}
