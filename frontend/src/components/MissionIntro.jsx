/**
 * MissionIntro.jsx
 * The mission briefing / learning objective screen shown before entering a challenge.
 * Displays: concept overview, objectives, difficulty, hints toggle, and Start Mission CTA.
 */
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import "./MissionIntro.css";

const DIFFICULTY_LABELS = ["", "Beginner", "Easy", "Intermediate", "Advanced", "Expert"];
const DIFFICULTY_COLORS = ["", "#22c55e", "#84cc16", "#f59e0b", "#f97316", "#ef4444"];

// Static mission content — in production this would come from /game/challenges
const MISSION_CONTENT = {
  os_processes: {
    objective: "Understand how the OS creates and manages processes through the entire lifecycle.",
    learning_points: [
      "Identify the 5 process states: New, Ready, Running, Waiting, Terminated",
      "Explain what data lives in a PCB (Process Control Block)",
      "Trace a process through a context switch",
    ],
    challenge_preview: "You'll receive a set of process state transitions and predict the next state.",
    hint_level_1: "Think about what event triggers each state transition.",
    hint_level_2: "A process moves from Running → Waiting when it makes an I/O request.",
  },
  os_scheduling: {
    objective: "Implement and compare CPU scheduling algorithms to minimize wait time.",
    learning_points: [
      "Calculate average waiting time for FCFS, SJF, and Round Robin",
      "Identify when each algorithm performs best/worst",
      "Understand starvation and how aging fixes it",
    ],
    challenge_preview: "Given a process arrival table, simulate the chosen scheduling algorithm.",
    hint_level_1: "Draw a Gantt chart first — order arrivals by the algorithm's priority rule.",
    hint_level_2: "For Round Robin, use a queue and track remaining burst time per process.",
  },
  os_memory: {
    objective: "Manage a simulated memory space using allocation and deallocation strategies.",
    learning_points: [
      "Distinguish between contiguous and non-contiguous allocation",
      "Observe how fragmentation builds up over time",
      "Compare First Fit, Best Fit, and Worst Fit strategies",
    ],
    challenge_preview: "Allocate and free memory blocks to achieve a target fragmentation level.",
    hint_level_1: "Watch the fragmentation meter — small gaps between blocks add up fast.",
    hint_level_2: "Best Fit leaves the smallest leftover hole; First Fit is faster but messier.",
  },
  os_paging: {
    objective: "Implement page replacement algorithms to minimize page faults.",
    learning_points: [
      "Build a page table and translate virtual to physical addresses",
      "Compare FIFO, LRU, and OPT page replacement policies",
      "Understand Belady's anomaly in FIFO",
    ],
    challenge_preview: "Simulate a page reference string against a limited frame count.",
    hint_level_1: "Track which pages are in frames and which was accessed most recently.",
    hint_level_2: "LRU: evict the page whose last use was furthest in the past.",
  },
  dbms_btree: {
    objective: "Perform B+ tree insertions and understand when/how splits propagate.",
    learning_points: [
      "Insert keys into a B+ tree with order 3",
      "Identify when a node overflows and how to split it",
      "Trace how a split propagates up to the root",
    ],
    challenge_preview: "Insert a sequence of keys into the B+ tree visualizer.",
    hint_level_1: "A node overflows when it contains more than (order-1) keys.",
    hint_level_2: "On split: median key moves up, left half stays, right half becomes new sibling.",
  },
  dbms_transactions: {
    objective: "Apply ACID properties to identify valid vs. invalid transaction schedules.",
    learning_points: [
      "Verify serializability using a conflict graph",
      "Identify dirty reads, non-repeatable reads, and phantom reads",
      "Choose the correct isolation level for a scenario",
    ],
    challenge_preview: "Given a schedule, determine if it's conflict-serializable.",
    hint_level_1: "Build a precedence graph: draw an edge T1→T2 when T1 and T2 conflict.",
    hint_level_2: "A schedule is conflict-serializable if and only if the precedence graph is acyclic.",
  },
};

const DEFAULT_CONTENT = {
  objective: "Master this concept through hands-on simulation.",
  learning_points: ["Understand the core theory", "Apply it in a simulated environment", "Verify your understanding with the goal checker"],
  challenge_preview: "Interact with the simulator to complete the mission objectives.",
  hint_level_1: "Read the goal panel carefully before taking any action.",
  hint_level_2: "Try the simplest valid command first to see the system respond.",
};

export default function MissionIntro({ node, status, mastery, domainColor, onClose }) {
  const [hintLevel, setHintLevel] = useState(0);
  const content = MISSION_CONTENT[node.slug] || DEFAULT_CONTENT;

  return (
    <motion.div
      className="mission-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="mission-modal"
        style={{ "--mc": domainColor }}
        initial={{ scale: 0.9, y: 40, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
      >
        {/* Close */}
        <button className="mission-close" onClick={onClose}>✕</button>

        {/* Header */}
        <div className="mission-header">
          <div className="mission-icon-wrap">
            <span className="mission-icon">{node.icon}</span>
          </div>
          <div>
            <div className="mission-domain-tag" style={{ color: domainColor }}>
              MISSION BRIEFING
            </div>
            <h2 className="mission-title">{node.name}</h2>
          </div>
        </div>

        {/* Status bar */}
        <div className="mission-stats">
          <div className="mission-stat">
            <span className="mstat-label">DIFFICULTY</span>
            <span className="mstat-val" style={{ color: DIFFICULTY_COLORS[node.difficulty] }}>
              {DIFFICULTY_LABELS[node.difficulty]}
            </span>
          </div>
          <div className="mission-stat">
            <span className="mstat-label">XP REWARD</span>
            <span className="mstat-val gold">+{node.xp} XP</span>
          </div>
          <div className="mission-stat">
            <span className="mstat-label">MASTERY</span>
            <span className="mstat-val" style={{ color: domainColor }}>{mastery}%</span>
          </div>
          <div className="mission-stat">
            <span className="mstat-label">STATUS</span>
            <span className={`mstat-val status-${status}`}>
              {status === "mastered" ? "✓ Mastered" : status === "in_progress" ? "⟳ In Progress" : "◆ Available"}
            </span>
          </div>
        </div>

        {/* Objective */}
        <div className="mission-section">
          <div className="mission-section-label">🎯 OBJECTIVE</div>
          <p className="mission-objective">{content.objective}</p>
        </div>

        {/* Learning points */}
        <div className="mission-section">
          <div className="mission-section-label">📚 YOU WILL LEARN</div>
          <ul className="mission-points">
            {content.learning_points.map((pt, i) => (
              <li key={i} className="mission-point">
                <span className="mission-point-dot" style={{ background: domainColor }} />
                {pt}
              </li>
            ))}
          </ul>
        </div>

        {/* Challenge preview */}
        <div className="mission-section">
          <div className="mission-section-label">⚙️ CHALLENGE FORMAT</div>
          <p className="mission-preview">{content.challenge_preview}</p>
        </div>

        {/* Progressive hints */}
        <div className="mission-hints">
          <div className="hints-label">Need a head start?</div>
          <div className="hints-buttons">
            <button
              className={`hint-btn ${hintLevel >= 1 ? "revealed" : ""}`}
              onClick={() => setHintLevel(Math.max(1, hintLevel))}
              style={{ "--mc": domainColor }}
            >
              💡 Hint 1
            </button>
            <button
              className={`hint-btn ${hintLevel >= 2 ? "revealed" : ""}`}
              onClick={() => setHintLevel(2)}
              style={{ "--mc": domainColor }}
            >
              💡 Hint 2
            </button>
          </div>
          {hintLevel >= 1 && (
            <motion.div
              className="hint-reveal"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <span className="hint-num">Hint 1:</span> {content.hint_level_1}
            </motion.div>
          )}
          {hintLevel >= 2 && (
            <motion.div
              className="hint-reveal"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <span className="hint-num">Hint 2:</span> {content.hint_level_2}
            </motion.div>
          )}
        </div>

        {/* CTA */}
        <div className="mission-cta">
          <Link
            to={node.route}
            className="mission-start-btn"
            style={{ "--mc": domainColor }}
            onClick={onClose}
          >
            <span>⚡ START MISSION</span>
          </Link>
          <button className="mission-cancel-btn" onClick={onClose}>
            Back to Tree
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
