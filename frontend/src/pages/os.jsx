import React, { useState } from "react";
import Navbar from "../components/navbar";
import { motion, AnimatePresence } from "framer-motion";
import "./Os.css";

export default function Os() {
  const missionsData = [
    {
      title: "1. OS Architecture & Components",
      topics: ["Kernel Types", "System Calls"]
    },
    {
      title: "2. Process Management",
      topics: ["PCB", "Scheduling Algorithms"]
    },
    {
      title: "3. Memory Management",
      topics: ["Paging", "Segmentation"]
    },
    {
      title: "4. Synchronization",
      topics: ["Mutex", "Semaphores"]
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
            Operating <span>System</span>
          </h1>
          <p>
            Master core OS concepts including processes, memory management,
            scheduling, synchronization, kernel architecture, and system internals.
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
              <motion.div
                key={index}
                className="timeline-item"
                variants={fadeUp}
              >
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
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                      >
                        {mission.topics.map((topic, topicIndex) => {
                          const key = `${index}-${topicIndex}`;
                          const isDone = completed[key];

                          return (
                            <motion.div
                              key={topicIndex}
                              className="topic-row"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: topicIndex * 0.1 }}
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