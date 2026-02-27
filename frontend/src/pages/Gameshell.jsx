import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/navbar";
import Terminal from "../components/Terminal";
import MemoryMap from "../components/Memorymap";
import BTreeVisualizer from "../components/BTreeVisualizer";
import TableInspector from "../components/TableInspector";
import EventLog from "../components/Eventlog";
import GoalPanel from "../components/Goalpanel";
import "./Gameshell.css";
import XPHud from "../components/XPHud";
import HintPanel from "../components/HintPanel";
import useGameStore from "../store/useGameStore";
import useGameStore1 from "../store/use1";
import useProgressStore from "../store/useProgressStore";
import apiClient from "../services/api";

// ─── Topic intro content ──────────────────────────────────────────────────────
// Keyed by the module slug that comes from the URL (:module param)
const TOPIC_CONTENT = {
  // OS topics
  "what-is-an-operating-system": {
    title: "What is an Operating System?",
    icon: "🖥️",
    color: "#00e5ff",
    summary: "An Operating System is the master control program that manages hardware resources and provides services to applications. It acts as the bridge between user programs and the physical machine.",
    keyPoints: [
      "The OS controls CPU, memory, I/O devices and file systems",
      "Kernel mode vs User mode separates privileged OS code from user apps",
      "System calls are the API between user programs and the kernel",
      "Modern OSes use virtual memory so each process feels like it owns all RAM",
    ],
    challenge: "Use ALLOC and FREE commands to manage memory blocks. Observe how the OS tracks allocated vs free regions.",
    hint: "Start with ALLOC 256 to allocate a 256 MB block, then FREE it by name to release it.",
  },
  "memory-management": {
    title: "Memory Management",
    icon: "🧩",
    color: "#00e5ff",
    summary: "Memory management is how the OS allocates, tracks and reclaims physical RAM across processes. Poor management leads to fragmentation — wasted gaps of unusable memory.",
    keyPoints: [
      "Contiguous allocation gives each process one solid block",
      "First Fit picks the first hole large enough; Best Fit picks the smallest fit",
      "External fragmentation: free space exists but is split into unusable chunks",
      "Compaction merges free fragments — expensive but fixes fragmentation",
    ],
    challenge: "Allocate multiple blocks, free some, and observe the fragmentation that builds up.",
    hint: "Try: ALLOC 300 A → ALLOC 200 B → ALLOC 100 C → FREE B — notice the hole left behind.",
  },
  "process-vs-program": {
    title: "Process Management",
    icon: "⚙️",
    color: "#00e5ff",
    summary: "A process is a running instance of a program — it has its own memory space, CPU registers, and lifecycle. The OS scheduler decides which process runs on the CPU at any moment.",
    keyPoints: [
      "Process states: New → Ready → Running → Waiting → Terminated",
      "The PCB (Process Control Block) stores all state for a process",
      "Context switching saves one process state and restores another",
      "Scheduling algorithms: FCFS, SJF, Round Robin each have different tradeoffs",
    ],
    challenge: "Manage memory regions that simulate process allocation and deallocation.",
    hint: "Each ALLOC simulates a process requesting memory; FREE simulates termination.",
  },
  // DBMS topics
  "b-tree": {
    title: "B-Tree Indexing",
    icon: "🌳",
    color: "#a855f7",
    summary: "A B-Tree is a self-balancing tree used in databases to keep data sorted and allow fast search, insert, and delete in O(log n). It is optimized for disk storage — each node holds multiple keys.",
    keyPoints: [
      "Order-3 B-tree: each node holds at most 2 keys and 3 child pointers",
      "When a node overflows (too many keys), it splits — median key moves up",
      "Root splits create a new level, increasing tree height by 1",
      "All leaf nodes are at the same depth — the tree stays perfectly balanced",
    ],
    challenge: "Insert keys into the B-Tree visualizer. Trigger a node split by inserting enough keys into one node.",
    hint: "Insert 10, 20, 30 in sequence — the node will overflow on the 3rd key and split.",
  },
  "b+-tree": {
    title: "B+ Tree",
    icon: "🌲",
    color: "#a855f7",
    summary: "A B+ Tree improves on the B-Tree by storing all actual data in the leaf nodes, with internal nodes acting purely as routing keys. Leaves are linked together for fast range scans.",
    keyPoints: [
      "Internal nodes store only keys for routing — no data pointers",
      "All data lives in leaf nodes, which are linked in a sorted chain",
      "Range queries traverse the linked leaf chain in O(k + log n)",
      "Used in virtually every modern RDBMS: InnoDB, PostgreSQL, SQLite",
    ],
    challenge: "Use INSERT to build the tree, then SELECT to traverse and highlight the search path.",
    hint: "INSERT several keys then SELECT one — watch the highlighted path trace from root to leaf.",
  },
  "node-splitting": {
    title: "Node Splitting",
    icon: "✂️",
    color: "#a855f7",
    summary: "Node splitting is what keeps a B-Tree balanced. When a node exceeds its maximum key count, it splits in two — the middle key is promoted to the parent node.",
    keyPoints: [
      "A node with order t overflows when it has 2t-1 keys",
      "Split: left half stays, right half becomes new sibling, median moves up",
      "If the root splits, a new root is created — this is how the tree grows taller",
      "Splits propagate upward only when the parent also overflows",
    ],
    challenge: "Insert enough keys to trigger multiple splits and see how the tree reorganizes.",
    hint: "Keep inserting sequential keys: 10, 20, 30, 40, 50 — each overflow triggers a visible split.",
  },
  "transactions": {
    title: "Transactions & ACID",
    icon: "🔐",
    color: "#a855f7",
    summary: "A transaction is a sequence of database operations that must execute as a single atomic unit. ACID properties guarantee correctness even when failures occur mid-transaction.",
    keyPoints: [
      "Atomicity: all operations commit or all are rolled back — no partial updates",
      "Consistency: the DB moves from one valid state to another",
      "Isolation: concurrent transactions don't interfere with each other",
      "Durability: committed data survives crashes via the write-ahead log",
    ],
    challenge: "Practice INSERT and DELETE operations on the B-Tree — each simulates a transactional operation.",
    hint: "INSERT a key, then INSERT several more. Try querying mid-insert to see isolation in action.",
  },
  "acid-properties": {
    title: "ACID Properties",
    icon: "⚗️",
    color: "#a855f7",
    summary: "ACID is the gold standard for database reliability. Each property addresses a specific failure scenario to ensure your data is never lost, corrupted or inconsistent.",
    keyPoints: [
      "Atomicity prevents half-written transactions from corrupting the DB",
      "Consistency rules (constraints, triggers) are enforced on every commit",
      "Isolation levels (Read Committed, Serializable) control concurrency tradeoffs",
      "Durability is achieved via WAL — changes are logged before being applied",
    ],
    challenge: "Perform a sequence of INSERTs to simulate a multi-step transaction on the B-Tree.",
    hint: "Think of each INSERT as one step in a bank transfer — all must succeed or none should.",
  },
};

const DEFAULT_TOPIC = {
  title: "Mission Briefing",
  icon: "🎯",
  color: "#ff8400",
  summary: "You are entering an interactive simulation. Use the terminal commands to interact with the system and complete all mission objectives shown in the Goal Panel.",
  keyPoints: [
    "Read the Goal Panel on the right to understand your objectives",
    "Type commands in the terminal at the bottom",
    "Each successful action earns XP and progresses your mastery",
    "Use the 💡 Hint button if you get stuck",
  ],
  challenge: "Complete all goals shown in the Mission Objectives panel.",
  hint: "Start with the simplest command — for OS: try ALLOC 256. For DBMS: try INSERT 42.",
};

// ─── Mission Complete Modal ───────────────────────────────────────────────────
function MissionCompleteModal({ domain, onClose }) {
  const color = domain === "os" ? "#00e5ff" : "#a855f7";
  return (
    <motion.div
      className="mc-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="mc-modal"
        style={{ "--mc": color }}
        initial={{ scale: 0.7, opacity: 0, y: 60 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
      >
        <div className="mc-burst">🎉</div>
        <h2 className="mc-title">MISSION COMPLETE</h2>
        <p className="mc-subtitle">All objectives achieved!</p>
        <div className="mc-stats">
          <div className="mc-stat">
            <span className="mc-stat-label">STATUS</span>
            <span className="mc-stat-val" style={{ color }}>✓ SECURED</span>
          </div>
          <div className="mc-stat">
            <span className="mc-stat-label">MASTERY</span>
            <span className="mc-stat-val" style={{ color }}>+XP EARNED</span>
          </div>
        </div>
        <p className="mc-flavor">
          The system has acknowledged your competency. Your mastery score has been updated.
        </p>
        <button className="mc-close-btn" style={{ "--mc": color }} onClick={onClose}>
          ⚡ Continue
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Topic Intro Modal ────────────────────────────────────────────────────────
function TopicIntroModal({ module, domain, onStart }) {
  const slug = module || "";
  const content = TOPIC_CONTENT[slug] || DEFAULT_TOPIC;
  const color = content.color || (domain === "os" ? "#00e5ff" : "#a855f7");

  return (
    <motion.div
      className="ti-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="ti-modal"
        style={{ "--tc": color }}
        initial={{ scale: 0.88, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
      >
        {/* Header */}
        <div className="ti-header">
          <div className="ti-icon-wrap">
            <span className="ti-icon">{content.icon}</span>
          </div>
          <div className="ti-header-text">
            <div className="ti-domain-tag" style={{ color }}>
              {domain?.toUpperCase()} — MISSION BRIEFING
            </div>
            <h2 className="ti-title">{content.title}</h2>
          </div>
        </div>

        {/* Summary */}
        <div className="ti-section">
          <div className="ti-section-label">📖 CONCEPT OVERVIEW</div>
          <p className="ti-summary" style={{ borderLeftColor: color }}>{content.summary}</p>
        </div>

        {/* Key points */}
        <div className="ti-section">
          <div className="ti-section-label">📚 KEY PRINCIPLES</div>
          <ul className="ti-points">
            {content.keyPoints.map((pt, i) => (
              <li key={i} className="ti-point">
                <span className="ti-dot" style={{ background: color }} />
                {pt}
              </li>
            ))}
          </ul>
        </div>

        {/* Challenge */}
        <div className="ti-section">
          <div className="ti-section-label">⚙️ YOUR CHALLENGE</div>
          <p className="ti-challenge">{content.challenge}</p>
        </div>

        {/* Hint */}
        <div className="ti-hint-box">
          <span className="ti-hint-label">💡 Quick Start:</span> {content.hint}
        </div>

        {/* CTA */}
        <button className="ti-start-btn" style={{ "--tc": color }} onClick={onStart}>
          ⚡ START MISSION
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Auto-feedback Banner ─────────────────────────────────────────────────────
function FeedbackBanner({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      className="fb-banner"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <span className="fb-icon">🤖</span>
      <p className="fb-msg">{message}</p>
      <button className="fb-dismiss" onClick={onDismiss}>✕</button>
    </motion.div>
  );
}

// ─── Main GameShell ───────────────────────────────────────────────────────────
export default function GameShell() {
  const { domain, module } = useParams();

  const [showIntro, setShowIntro]         = useState(true);
  const [showComplete, setShowComplete]   = useState(false);
  const [feedbackMsg, setFeedbackMsg]     = useState(null);
  const completeFiredRef                  = useRef(false);
  const failureCountRef                   = useRef(0);
  const feedbackCooldownRef               = useRef(false);

  // Store selectors
  const sessionId  = useGameStore((s) => s.sessionId);
  const dbmsGoals  = useGameStore((s) => s.goals ?? []);
  const osGoals    = useGameStore1((s) => s.goals ?? []);
  const osHistory  = useGameStore1((s) => s.commandHistory ?? []);
  const dbmsHistory = useGameStore((s) => s.commandHistory ?? []);

  const goals   = domain === "os" ? osGoals   : dbmsGoals;
  const history = domain === "os" ? osHistory : dbmsHistory;

  // ── All-goals-complete detection ──────────────────────────────────────────
  useEffect(() => {
    if (completeFiredRef.current) return;
    if (goals.length > 0 && goals.every((g) => g.completed)) {
      completeFiredRef.current = true;
      // Small delay so the last goal's tick animation plays first
      setTimeout(() => setShowComplete(true), 600);
    }
  }, [goals]);

  // ── Auto-feedback on consecutive failures ─────────────────────────────────
  const fetchAutoFeedback = useCallback(async () => {
    if (feedbackCooldownRef.current) return;
    feedbackCooldownRef.current = true;

    try {
      const res = await apiClient.get("/game/adaptive/hint", {
        params: {
          session_token: sessionId || "",
          challenge_slug: module || "",
          hint_level: 1,
        },
      });
      const hint = res.data?.hint;
      if (hint?.message) {
        setFeedbackMsg(hint.message);
      } else {
        setFeedbackMsg(
          "Looks like you're hitting errors. Double-check your command syntax — for OS: ALLOC [size] [name] | FREE [name]. For DBMS: INSERT [key] | SELECT [key]."
        );
      }
    } catch {
      setFeedbackMsg(
        "Several errors in a row detected. Check your syntax and review the Goal Panel for what's expected."
      );
    }

    // Cooldown: don't fire again for 30 s
    setTimeout(() => {
      feedbackCooldownRef.current = false;
    }, 30000);
  }, [sessionId, module]);

  useEffect(() => {
    if (history.length < 3) return;
    // Look at the last 3 commands
    const recent = history.slice(-3);
    const recentFails = recent.filter(
      (e) =>
        e.output?.toLowerCase().includes("failed") ||
        e.output?.toLowerCase().includes("not found") ||
        e.output?.toLowerCase().includes("invalid") ||
        e.output?.toLowerCase().includes("error")
    );
    if (recentFails.length >= 3) {
      failureCountRef.current += 1;
      fetchAutoFeedback();
    }
  }, [history, fetchAutoFeedback]);

  return (
    <>
      <Navbar />
      <XPHud />

      {/* Topic intro shown once on first visit */}
      <AnimatePresence>
        {showIntro && (
          <TopicIntroModal
            module={module}
            domain={domain}
            onStart={() => setShowIntro(false)}
          />
        )}
      </AnimatePresence>

      {/* Mission complete modal */}
      <AnimatePresence>
        {showComplete && (
          <MissionCompleteModal
            domain={domain}
            onClose={() => setShowComplete(false)}
          />
        )}
      </AnimatePresence>

      {/* Auto-feedback banner */}
      <AnimatePresence>
        {feedbackMsg && (
          <FeedbackBanner
            message={feedbackMsg}
            onDismiss={() => setFeedbackMsg(null)}
          />
        )}
      </AnimatePresence>

      <div className="game-container">
        <div className="left-panel">
          {domain === "dbms" ? (
            <div className="dbms-workspace">
              <div className="tree-canvas">
                <BTreeVisualizer />
              </div>
              <div className="details-sidebar">
                <TableInspector />
              </div>
            </div>
          ) : (
            <MemoryMap />
          )}
        </div>

        <div className="right-panel">
          <GoalPanel />
          <HintPanel sessionToken={sessionId} challengeSlug={module} />
          <EventLog />
        </div>

        <div className="bottom-panel">
          <Terminal />
        </div>
      </div>
    </>
  );
}
