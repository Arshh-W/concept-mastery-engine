import React from 'react';
import Navbar from '../components/navbar';
import './roadmap.css';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Roadmap() {
  return (
    <div>
      <Navbar />

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 1 }}
      >


        <div className="selection-screen">


          <header className="selection-header">
            <h1 className="selection-title">Choose Your Path</h1>
            <p className="selection-subtitle">Select a roadmap to start your coding journey</p>
          </header>
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="scanline"></div>
          <div className="scanline"></div>
          <div className="selection-cards">
            {/* OS Portal */}
            <div className="portal-card os-theme">
              <div className="portal-content">
                <div className="portal-icon">⚙️</div>
                <h2>Operating Systems</h2>
                <p>Master the kernel, process synchronization, and memory management.</p>
                <Link to="/os" className="enter-btn">
                  Initialize Mission
                </Link>
              </div>
              <div className="portal-bg"></div>
            </div>

            {/* DBMS Portal */}
            <div className="portal-card db-theme">
              <div className="portal-content">
                <div className="portal-icon">🗄️</div>
                <h2>Database Systems</h2>
                <p>Unlock the secrets of indexing, transactions, and relational logic.</p>
                <Link to="/dbms" className="enter-btn">
                  Initialize Mission
                </Link>
              </div>
              <div className="portal-bg"></div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}