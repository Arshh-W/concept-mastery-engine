import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gameApi } from "../services/api";
import useProgressStore from "../store/useProgressStore";
import "./os.css";

export default function Os() {
  const [openIndex, setOpenIndex]   = useState(null);
  const [masteryData, setMasteryData] = useState({});
  const navigate = useNavigate();

  const completedTopics = useProgressStore((s) => s.completedTopics ?? []);

  useEffect(() => {
    const fetchMastery = async () => {
      try {
        const res = await gameApi.getMasteryChallenges("os");
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
      topics: [
        { label: "What is an Operating System?", slug: "what-is-an-operating-system" },
        { label: "Kernel vs User Mode",           slug: "kernel-vs-user-mode" },
        { label: "System Calls",                  slug: "system-calls" },
        { label: "OS Architecture",               slug: "os-architecture" },
      ],
    },
    {
      id: "process_mgmt_2",
      title: "2. Process Management",
      topics: [
        { label: "Process vs Program",            slug: "process-vs-program" },
        { label: "Process States",                slug: "process-states" },
        { label: "Context Switching",             slug: "context-switching" },
        { label: "CPU Scheduling - FCFS",         slug: "cpu-scheduling---fcfs" },
        { label: "Round Robin",                   slug: "round-robin" },
      ],
    },
    {
      id: "memory_mgmt_3",
      title: "3. Memory Management",
      topics: [
        { label: "Contiguous Allocation",         slug: "contiguous-allocation" },
        { label: "Paging",                        slug: "paging" },
        { label: "Segmentation",                  slug: "segmentation" },
        { label: "Virtual Memory",                slug: "virtual-memory" },
        { label: "Page Replacement - LRU",        slug: "page-replacement---lru" },
      ],
    },
    {
      id: "sync_4",
      title: "4. Synchronization & Concurrency",
      topics: [
        { label: "Critical Section",              slug: "critical-section" },
        { label: "Mutex",                         slug: "mutex" },
        { label: "Semaphores",                    slug: "semaphores" },
        { label: "Deadlock",                      slug: "deadlock" },
        { label: "Banker's Algorithm",            slug: "bankers-algorithm" },
      ],
    },
    {
      id: "file_systems_5",
      title: "5. File Systems",
      topics: [
        { label: "Inodes",                        slug: "inodes" },
        { label: "Disk Scheduling - FCFS",        slug: "disk-scheduling---fcfs" },
        { label: "SCAN",                          slug: "scan" },
        { label: "C-SCAN",                        slug: "c-scan" },
      ],
    },
  ];

  const handleLaunchMission = (slug) => {
    navigate(`/game/os/${slug}`);
  };

  const toggleDropdown = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const totalMissions    = missionsData.length;
  const completedMissions = missionsData.filter((m) => masteryData[m.id] >= 0.8).length;
  const progressPercent  = Math.round((completedMissions / totalMissions) * 100);

  return (
    <>
      <Navbar />
      <motion.div className="os-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="os-hero">
          <h1>Operating <span>System</span></h1>
          <p>Master the kernel internals and resource management.</p>
        </div>

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
            {missionsData.map((mission, index) => {
              const missionDone = masteryData[mission.id] >= 0.8;
              return (
                <div key={index} className="timeline-item">
                  <div
                    className="timeline-dot"
                    style={{ borderColor: missionDone ? "#00e5ff" : "#444" }}
                  />
                  <div className={`mission-card ${missionDone ? "mission-card--done" : ""}`}>
                    <div
                      className="mission-header"
                      onClick={() => toggleDropdown(index)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="header-info">
                        <span className="mission-title">{mission.title}</span>
                        {missionDone && <span className="certified">SECURED</span>}
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
                          {mission.topics.map((topic, tIdx) => {
                            const done = completedTopics.includes(topic.slug);
                            return (
                              <div key={tIdx} className={`topic-row ${done ? "topic-row--done" : ""}`}>
                                <span className="topic-name">
                                  <span className={`status-dot ${done ? "status-dot--done" : ""}`} />
                                  {topic.label}
                                  {done && <span className="topic-done-badge">✓ Done</span>}
                                </span>
                                <button
                                  className={`launch-btn os-theme ${done ? "launch-btn--replay" : ""}`}
                                  onClick={() => handleLaunchMission(topic.slug)}
                                >
                                  {done ? "↺ Replay" : "Execute ⚡"}
                                </button>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
}
