import React, { useEffect, useState } from 'react';
import Navbar from '../components/navbar';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { gameApi } from '../services/api';
import './roadmap.css';

export default function Roadmap() {
  const [progress, setProgress] = useState({ os: 0, dbms: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await gameApi.getUserProgress();
        // Assuming backend returns { os_mastery: 45, dbms_mastery: 20 }
        setProgress({
          os: res.data.os_mastery || 0,
          dbms: res.data.dbms_mastery || 0
        });
      } catch (err) {
        console.error("Failed to fetch roadmap progress", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  return (
    <div className="roadmap-page">
      <Navbar />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="selection-screen">
          <header className="selection-header">
            <h1 className="selection-title">Choose Your Path</h1>
            <p className="selection-subtitle">Select a domain to resume your training</p>
          </header>

          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="scanline"></div>

          <div className="selection-cards">
            {/* OS Portal */}
            <div className="portal-card os-theme">
              <div className="portal-content">
                <div className="portal-icon">⚙️</div>
                <h2>Operating Systems</h2>
                <p>Master the kernel, process synchronization, and memory management.</p>
                
                {/* Progress Bar UI */}
                <div className="progress-container">
                  <div className="progress-label">System Integrity: {progress.os}%</div>
                  <div className="progress-bar">
                    <motion.div 
                      className="progress-fill" 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.os}%` }}
                    />
                  </div>
                </div>

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

                {/* Progress Bar UI */}
                <div className="progress-container">
                  <div className="progress-label">Database Sync: {progress.dbms}%</div>
                  <div className="progress-bar">
                    <motion.div 
                      className="progress-fill" 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.dbms}%` }}
                    />
                  </div>
                </div>

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