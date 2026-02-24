import React, { useState } from "react";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./Os.css";

export default function Dbms() {
  const missionsData = [
    {
      title: "1. DBMS Fundamentals",
      topics: [
        "What is DBMS?",
        "Database Architecture (1-Tier, 2-Tier, 3-Tier)",
        "Advantages of DBMS",
        "Types of Databases"
      ]
    },
    {
      title: "2. Relational Model & Normalization",
      topics: [
        "Relational Model",
        "ER Model",
        "Mapping ER to Relational Model",
        "Functional Dependencies",
        "1NF",
        "2NF",
        "3NF",
        "BCNF"
      ]
    },
    {
      title: "3. Transactions & Concurrency Control",
      topics: [
        "Transactions",
        "ACID Properties",
        "Concurrency Problems (Lost Update, Dirty Read)",
        "Locks (Shared & Exclusive)",
        "Two-Phase Locking (2PL)",
        "Deadlocks",
        "Deadlock Detection & Prevention"
      ]
    },
    {
      title: "4. Indexing & Trees (Core Visual Module)",
      topics: [
        "Binary Search Tree",
        "B-Tree",
        "B+ Tree",
        "Node Splitting",
        "Node Merging",
        "Height Growth",
        "Traversal Paths",
        "Index vs Table Scan"
      ]
    },
    {
      title: "5. Query Processing & Optimization",
      topics: [
        "SELECT Statement",
        "WHERE Filtering",
        "Index Usage in Queries",
        "Joins (Inner Join, Outer Join)",
        "Query Optimization Basics"
      ]
    }
  ];

  const navigate = useNavigate();

  const [openIndex, setOpenIndex] = useState(null);
  const [completed, setCompleted] = useState({});

  const toggleDropdown = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };


  const handleLaunchMission = (topic) => {
    
    const moduleSlug = topic.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
    
    
    navigate(`/game/dbms/${moduleSlug}`);
  };

  const toggleComplete = (missionIndex, topicIndex) => {
    const key = `${missionIndex}-${topicIndex}`;
    setCompleted((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const totalTopics = missionsData.reduce(
    (acc, mission) => acc + mission.topics.length,
    0
  );

  const completedCount = Object.values(completed).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalTopics) * 100);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 60 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <>
      <Navbar />
      <motion.div className="os-page" initial="hidden" animate="show">
        {/* Hero and Progress Card sections remain as they are */}
        
        <motion.div className="learning-path">
          <h2>Learning Path</h2>
          <div className="timeline">
            {missionsData.map((mission, index) => (
              <motion.div key={index} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="mission-card">
                  <div className="mission-header" onClick={() => toggleDropdown(index)} style={{cursor: 'pointer'}}>
                    <span>{mission.title}</span>
                    <motion.button
                      className="dropdown-btn"
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                    >
                      ▼
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div className="mission-content">
                        {mission.topics.map((topic, topicIndex) => (
                          <div key={topicIndex} className="topic-row">
                            <span>{topic}</span>
                            {/* Updated Button to Launch Mission */}
                            <button
                              className="launch-btn"
                              onClick={() => handleLaunchMission(topic)}
                            >
                              Launch Mission 🚀
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