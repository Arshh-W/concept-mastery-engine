import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gameApi } from "../services/api"; // Import the API
import "./os.css";

export default function Os() {
  const [openIndex, setOpenIndex] = useState(null);
  const [masteryData, setMasteryData] = useState({}); // Real progress from backend
  const navigate = useNavigate();

  // 1. Fetch OS mastery on load
  useEffect(() => {
    const fetchMastery = async () => {
      try {
        const res = await gameApi.getMasteryChallenges('os');
        setMasteryData(res.data.challenges || {});
      } catch (err) {
        console.error("Failed to fetch OS mastery stats", err);
      }
    };
    fetchMastery();
  }, []);

  const missionsData = [
    {
      id: "os_fundamentals_1",
      title: "1. OS Fundamentals",
      topics: ["What is an Operating System?", "Kernel vs User Mode", "System Calls", "OS Architecture"]
    },
    {
      id: "process_mgmt_2",
      title: "2. Process Management",
      topics: ["Process vs Program", "Process States", "Context Switching", "CPU Scheduling - FCFS", "Round Robin"]
    },
    {
      id: "memory_mgmt_3",
      title: "3. Memory Management",
      topics: ["Contiguous Allocation", "Paging", "Segmentation", "Virtual Memory", "Page Replacement - LRU"]
    },
    {
      id: "sync_4",
      title: "4. Synchronization & Concurrency",
      topics: ["Critical Section", "Mutex", "Semaphores", "Deadlock", "Banker's Algorithm"]
    },
    {
      id: "file_systems_5",
      title: "5. File Systems",
      topics: ["Inodes", "Disk Scheduling - FCFS", "SCAN", "C-SCAN"]
    }
  ];

  // 2. Launch Mission logic linked to API
  const handleLaunchMission = async (topic) => {
    const moduleSlug = topic.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
    
    try {
      // Notify backend to start BKT tracking for this session
      await gameApi.startSession('os', moduleSlug);
      navigate(`/game/os/${moduleSlug}`);
    } catch (err) {
      console.warn("Backend offline, entering practice mode.");
      navigate(`/game/os/${moduleSlug}`);
    }
  };

  const toggleDropdown = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Calculate progress based on masteryData from API
  const totalMissions = missionsData.length;
  const completedMissions = missionsData.filter(m => masteryData[m.id] >= 0.8).length;
  const progressPercent = Math.round((completedMissions / totalMissions) * 100);

  return (
    <>
      <Navbar />
      <motion.div className="os-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        
        <div className="os-hero">
          <h1>Operating <span>System</span></h1>
          <p>Master the kernel internals and resource management.</p>
        </div>

        {/* Dynamic Progress Card */}
        <div className="os-progress-card">
          <div className="os-progress-header">
            <h3>Kernel Synchronization</h3>
            <span>{completedMissions} of {totalMissions} Sectors Secured</span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              animate={{ width: `${progressPercent}%` }}
              style={{ background: "#00e5ff", boxShadow: "0 0 10px #00e5ff" }}
            />
          </div>
        </div>

        <div className="learning-path">
          <h2>Learning Path</h2>
          <div className="timeline">
            {missionsData.map((mission, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-dot" style={{ borderColor: masteryData[mission.id] >= 0.8 ? "#00e5ff" : "#444" }}></div>
                <div className="mission-card">
                  <div className="mission-header" onClick={() => toggleDropdown(index)} style={{ cursor: 'pointer' }}>
                    <div className="header-info">
                      <span className="mission-title">{mission.title}</span>
                      {masteryData[mission.id] >= 0.8 && <span className="certified">SECURED</span>}
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
                            <span className="topic-name">{topic}</span>
                            <button className="launch-btn os-theme" onClick={() => handleLaunchMission(topic)}>
                              Execute ⚡
                            </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}