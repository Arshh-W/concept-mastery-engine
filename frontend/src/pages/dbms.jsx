import React, { useState } from "react";
import Navbar from "../components/navbar";
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

  const [openIndex, setOpenIndex] = useState(null);
  const [completed, setCompleted] = useState({});

  const toggleDropdown = (index) => {
    setOpenIndex(openIndex === index ? null : index);
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

      <motion.div
        className="os-page"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div className="os-hero" variants={fadeUp}>
          <h1>
            Database <span>Management System</span>
          </h1>
          <p>
            Master DBMS concepts including relational models, normalization,
            indexing, transactions, concurrency control, and query optimization.
          </p>
        </motion.div>

        <motion.div className="os-progress-card" variants={fadeUp}>
          <div className="os-progress-header">
            <h3>Overall Progress</h3>
            <span>
              {completedCount} of {totalTopics} Completed
            </span>
          </div>

          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </motion.div>

        <motion.div className="learning-path" variants={fadeUp}>
          <h2>Learning Path</h2>

          <div className="timeline">
            {missionsData.map((mission, index) => (
              <motion.div key={index} className="timeline-item">
                <div className="timeline-dot"></div>

                <div className="mission-card">
                  <div className="mission-header">
                    <span>{mission.title}</span>

                    <motion.button
                      className="dropdown-btn"
                      onClick={() => toggleDropdown(index)}
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      ▼
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        className="mission-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ overflow: "hidden" }}
                      >
                        {mission.topics.map((topic, topicIndex) => {
                          const key = `${index}-${topicIndex}`;
                          const isDone = completed[key];

                          return (
                            <motion.div
                              key={topicIndex}
                              className="topic-row"
                            >
                              <span>{topic}</span>

                              <button
                                className={`complete-btn ${
                                  isDone ? "done" : ""
                                }`}
                                onClick={() =>
                                  toggleComplete(index, topicIndex)
                                }
                              >
                                {isDone
                                  ? "Completed ✓"
                                  : "Mark as Complete"}
                              </button>
                            </motion.div>
                          );
                        })}
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