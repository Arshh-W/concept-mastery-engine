import React from 'react';
import Navbar from '../components/navbar';
import { motion } from 'framer-motion';
import "./about.css";

export default function About() {
    return (
        <div className="about-page">
            <Navbar />
            
            <motion.div 
                className="about-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                {/* Header Section */}
                <header className="about-header">
                    <span className="system-tag">System Initialization // v1.0</span>
                    <h1>The <span>Core</span> Mission</h1>
                    <p className="manifesto">
                        Traditional learning is a "static process." Code Conquer is a 
                        "Dynamic Engine." We've re-engineered OS and DBMS concepts into 
                        an interactive combat-ready environment.
                    </p>
                </header>

                {/* Grid Section: The Pillars */}
                <div className="about-grid">
                    <div className="about-card">
                        <h3>Gamified Architecture</h3>
                        <p>We believe the best way to understand a Deadlock is to experience one. Our engine simulates complex system states as game mechanics.</p>
                    </div>
                    <div className="about-card">
                        <h3>Terminal-First Learning</h3>
                        <p>No more slides. You interact with our integrated CLI to manage virtual memory and execute relational algebra missions.</p>
                    </div>
                    <div className="about-card">
                        <h3>The Conqueror’s Path</h3>
                        <p>From Kernel basics to Distributed Databases, every module is a "Level Up" for your real-world engineering career.</p>
                    </div>
                </div>

                {/* Closing Section */}
                <footer className="about-footer">
                    <h2>Ready to synchronize?</h2>
                    <p>Stop studying the system. Start conquering it.</p>
                </footer>
            </motion.div>
        </div>
    );
}