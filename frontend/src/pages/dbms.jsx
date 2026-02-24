import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gameApi } from "../services/api"; 
import "./os.css";

export default function Dbms() {
  const [openIndex, setOpenIndex] = useState(null);
  const [masteryData, setMasteryData] = useState({}); // To hold real progress from backend
  const navigate = useNavigate();


  useEffect(() => {
    const fetchMastery = async () => {
      try {
        const res = await gameApi.getMasteryChallenges('dbms');
        // Map backend data to a usable format for the UI
        setMasteryData(res.data.challenges || {});
      } catch (err) {
        console.error("Failed to fetch mastery stats", err);
      }
    };
    fetchMastery();
  }, []);

const missionsData = [
    {
      id: "fundamentals_1",
      title: "1. DBMS Fundamentals",
      topics: [
        "What is DBMS?", 
        "Database Architecture", 
        "Advantages of DBMS", 
        "Types of Databases"
      ]
    },
    {
      id: "relational_2",
      title: "2. Relational Model & Normalization",
      topics: [
        "Relational Model",
        "ER Model",
        "Functional Dependencies",
        "1NF / 2NF / 3NF",
        "BCNF"
      ]
    },
    {
      id: "transactions_3",
      title: "3. Transactions & Concurrency",
      topics: [
        "Transactions",
        "ACID Properties",
        "Concurrency Problems",
        "Locks and 2PL",
        "Deadlocks"
      ]
    },
    {
      id: "indexing_4",
      title: "4. Indexing & Trees (Core Visual Module)",
      topics: [
        "Binary Search Tree",
        "B-Tree", 
        "B+ Tree", 
        "Node Splitting", 
        "Traversal Paths"
      ]
    },
    {
      id: "query_opt_5",
      title: "5. Query Processing & Optimization",
      topics: [
        "SELECT Statement",
        "WHERE Filtering",
        "Joins (Inner/Outer)",
        "Index Usage in Queries",
        "Query Optimization Basics"
      ]
    }
  ];

  const handleLaunchMission = async (topic) => {
    const moduleSlug = topic.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
    
    try {
      // 2. Tell backend a session is starting
      // This allows the BKT (Bayesian Knowledge Tracing) to track this attempt
      await gameApi.startSession('dbms', moduleSlug);
      
      navigate(`/game/dbms/${moduleSlug}`);
    } catch (err) {
      console.warn("Could not start official session, entering practice mode.", err);
      navigate(`/game/dbms/${moduleSlug}`);
    }
  };

  const toggleDropdown = (index) => setOpenIndex(openIndex === index ? null : index);

  return (
    <>
      <Navbar />
      <motion.div className="os-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        
        {/* Progress Header */}
        <div className="dbms-hero">
          <h1>DBMS COMMAND CENTER</h1>
          <p>Master the data layer of the world.</p>
        </div>

        <motion.div className="learning-path">
          <h2>Learning Path</h2>
          <div className="timeline">
            {missionsData.map((mission, index) => (
              <motion.div key={index} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="mission-card">
                  <div className="mission-header" onClick={() => toggleDropdown(index)}>
                    <div className="header-info">
                      <span className="mission-title">{mission.title}</span>
                      {/* Show completion badge if mastery > 80% */}
                      {masteryData[mission.id] > 0.8 && <span className="certified">COMPLETED</span>}
                    </div>
                    <motion.button animate={{ rotate: openIndex === index ? 180 : 0 }}>▼</motion.button>
                  </div>

                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mission-content"
                      >
                        {mission.topics.map((topic, tIdx) => (
                          <div key={tIdx} className="topic-row">
                            <div className="topic-name">
                                <span className="status-dot"></span>
                                {topic}
                            </div>
                            <button className="launch-btn" onClick={() => handleLaunchMission(topic)}>
                              Execute ⚡
                            </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}