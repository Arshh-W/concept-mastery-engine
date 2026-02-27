import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/navbar";
import Terminal from "../components/Terminal";
import MemoryMap from "../components/Memorymap";
import BTreeVisualizer from "../components/BTreeVisualizer";
import TableInspector from "../components/TableInspector";
import EventLog from "../components/Eventlog";
import GoalPanel from "../components/Goalpanel";
import XPHud from "../components/XPHud";
import HintPanel from "../components/HintPanel";
import useGameStore from "../store/useGameStore";
import useGameStore1 from "../store/use1";
import useProgressStore from "../store/useProgressStore";
import apiClient from "../services/api";
import { getTopicConfig, SIMULATOR } from "../config/topicConfig";
import "./Gameshell.css";

// ─── Topic ordered sequences for "Next Level" ────────────────────────────────
const OS_TOPICS = [
  "what-is-an-operating-system","kernel-vs-user-mode","system-calls","os-architecture",
  "process-vs-program","process-states","context-switching","cpu-scheduling---fcfs","round-robin",
  "contiguous-allocation","paging","segmentation","virtual-memory","page-replacement---lru",
  "critical-section","mutex","semaphores","deadlock","bankers-algorithm",
  "inodes","disk-scheduling---fcfs","scan","c-scan",
];
const DBMS_TOPICS = [
  "what-is-dbms","database-architecture","advantages-of-dbms","types-of-databases",
  "relational-model","er-model","functional-dependencies","1nf-/-2nf-/-3nf","bcnf",
  "transactions","acid-properties","concurrency-problems","locks-and-2pl","deadlocks",
  "binary-search-tree","b-tree","b+-tree","node-splitting","traversal-paths",
  "select-statement","where-filtering","joins-inner-outer","index-usage-in-queries","query-optimization-basics",
];
function getNextTopic(domain, slug) {
  const list = domain === "os" ? OS_TOPICS : DBMS_TOPICS;
  const idx = list.indexOf(slug);
  return idx === -1 || idx === list.length - 1 ? null : list[idx + 1];
}

// ─── Intro Modal ─────────────────────────────────────────────────────────────
const INTRO_CONTENT = {
  "what-is-an-operating-system": { summary:"An OS is the master program managing hardware and software. It allocates memory, schedules CPU time, and mediates all hardware access.", icon:"🖥️" },
  "kernel-vs-user-mode":         { summary:"The CPU runs in two modes: Kernel (privileged, OS-only) and User (restricted, apps). System calls are the gateway between them.", icon:"⚡" },
  "system-calls":                { summary:"System calls are the API between user programs and the OS kernel. Every file read, memory allocation, and process spawn is a system call.", icon:"📞" },
  "os-architecture":             { summary:"Modern OSes are layered: hardware → kernel → OS services → user applications. Each layer has strict interfaces.", icon:"🏗️" },
  "process-vs-program":          { summary:"A program is passive (code on disk). A process is active (code in memory, executing). One program can spawn many processes.", icon:"⚙️" },
  "process-states":              { summary:"Every process cycles through states: New → Ready → Running → Waiting → Terminated. The OS scheduler drives these transitions.", icon:"🔄" },
  "context-switching":           { summary:"When the CPU switches between processes, it saves the outgoing process's state (PCB) and loads the incoming one. This is a context switch.", icon:"🔀" },
  "cpu-scheduling---fcfs":       { summary:"First-Come First-Served: processes are served in arrival order. Simple but can cause the convoy effect — short jobs wait behind long ones.", icon:"📅" },
  "round-robin":                 { summary:"Round Robin gives each process a fixed time quantum. Preempts when quantum expires and moves to the next in queue. Fair but adds overhead.", icon:"🔁" },
  "contiguous-allocation":       { summary:"Each process gets one solid block of RAM. Simple to implement but leads to external fragmentation — unusable holes between blocks.", icon:"🧩" },
  "paging":                      { summary:"Physical memory is split into fixed frames; logical memory into fixed pages. No external fragmentation, but page tables add overhead.", icon:"📄" },
  "segmentation":                { summary:"Memory is divided into logical segments (code, data, stack, heap). Each segment can grow independently but causes external fragmentation.", icon:"📦" },
  "virtual-memory":              { summary:"Each process sees a large private address space. The OS maps virtual pages to physical frames on demand, swapping to disk when needed.", icon:"🌐" },
  "page-replacement---lru":      { summary:"When a page fault occurs and frames are full, the OS must evict a page. LRU evicts the least recently used, keeping hot data in memory.", icon:"♻️" },
  "critical-section":            { summary:"A critical section is code that accesses shared resources. Only one process may be inside at a time. Mutex locks enforce mutual exclusion.", icon:"🚧" },
  "mutex":                       { summary:"A mutex (mutual exclusion lock) ensures only one thread enters a critical section at a time. Others block until the lock is released.", icon:"🔒" },
  "semaphores":                  { summary:"A semaphore is a counter used to control access to a shared resource. Wait() decrements it; Signal() increments it. Supports N concurrent users.", icon:"🚦" },
  "deadlock":                    { summary:"Deadlock: process A holds resource X and waits for Y; process B holds Y and waits for X. Neither can proceed. Recovery requires releasing a resource.", icon:"💀" },
  "bankers-algorithm":           { summary:"Banker's Algorithm ensures the system stays in a safe state before granting resource requests — if granting would cause deadlock, it waits.", icon:"🏦" },
  "inodes":                      { summary:"An inode stores file metadata (size, permissions, block pointers) but not the filename. Directories map names to inode numbers.", icon:"📁" },
  "disk-scheduling---fcfs":      { summary:"FCFS serves disk requests in arrival order. Easy to implement, but the disk head can thrash back and forth causing high seek times.", icon:"💿" },
  "scan":                        { summary:"SCAN (elevator) moves the disk head in one direction servicing requests, then reverses. Reduces seek time vs FCFS.", icon:"↔️" },
  "c-scan":                      { summary:"C-SCAN moves head in one direction only, then jumps to the start without servicing on the way back. More uniform wait times than SCAN.", icon:"🔃" },
  "what-is-dbms":                { summary:"A DBMS (Database Management System) manages structured data storage, retrieval, and integrity. It hides low-level file management complexity.", icon:"🗄️" },
  "database-architecture":       { summary:"DBMS architecture has 3 levels: External (user views), Conceptual (logical schema), Internal (physical storage). Each hides details from the level above.", icon:"🏛️" },
  "advantages-of-dbms":          { summary:"DBMS provides: data sharing, controlled redundancy, integrity constraints, concurrent access, backup/recovery, and security — all managed centrally.", icon:"✅" },
  "types-of-databases":          { summary:"Key DB types: Relational (SQL, row-based), Document (JSON, NoSQL), Key-Value (Redis), Column-family (Cassandra), Time-Series (InfluxDB).", icon:"🗂️" },
  "relational-model":            { summary:"The relational model stores data in tables (relations) with rows (tuples) and columns (attributes). Keys enforce uniqueness; foreign keys link tables.", icon:"🔗" },
  "er-model":                    { summary:"ER diagrams model entities (rectangles), attributes (ovals), and relationships (diamonds). M:N relationships need a junction table.", icon:"📐" },
  "functional-dependencies":     { summary:"A functional dependency A→B means knowing A uniquely determines B. FDs define what data belongs together and drive normalisation.", icon:"➡️" },
  "1nf-/-2nf-/-3nf":             { summary:"Normalisation removes redundancy. 1NF: atomic values. 2NF: no partial dependencies on composite key. 3NF: no transitive dependencies.", icon:"📊" },
  "bcnf":                        { summary:"BCNF (Boyce-Codd NF) is stricter than 3NF: every determinant must be a candidate key. Eliminates all anomalies based on functional dependencies.", icon:"🎯" },
  "transactions":                { summary:"A transaction is an atomic unit of work. All operations commit together or all roll back. The database always moves between consistent states.", icon:"🔐" },
  "acid-properties":             { summary:"ACID: Atomicity (all-or-nothing), Consistency (valid states only), Isolation (concurrent transactions don't interfere), Durability (committed data survives crashes).", icon:"⚗️" },
  "concurrency-problems":        { summary:"Concurrent transactions cause: dirty reads (uncommitted data), non-repeatable reads (changed between reads), and phantom reads (new rows appear mid-query).", icon:"⚠️" },
  "locks-and-2pl":               { summary:"Two-Phase Locking (2PL): growing phase (only acquire locks), then shrinking phase (only release). The lock point separates them. Ensures serializability.", icon:"🔑" },
  "deadlocks":                   { summary:"Transaction deadlock: T1 holds lock A and waits for B; T2 holds B and waits for A. Detection uses wait-for graphs; resolution aborts one transaction.", icon:"💥" },
  "binary-search-tree":          { summary:"BST: every left child < parent < right child. O(log n) search on average but degrades to O(n) on sorted input. Not self-balancing.", icon:"🌿" },
  "b-tree":                      { summary:"B-Tree: self-balancing, multi-key nodes, all leaves at same depth. Order-3 means max 2 keys / 3 children per node. O(log n) guaranteed.", icon:"🌳" },
  "b+-tree":                     { summary:"B+ Tree: data only at leaf level; leaves linked for range scans. Internal nodes are pure routing keys. Used in InnoDB, PostgreSQL, SQLite.", icon:"🌲" },
  "node-splitting":              { summary:"When a B-Tree node overflows its key limit, it splits: left half stays, right half becomes new sibling, median key promoted to parent.", icon:"✂️" },
  "traversal-paths":             { summary:"Tree traversal compares the search key against node values to go left or right at each level. Path length = number of disk I/Os needed.", icon:"🗺️" },
  "select-statement":            { summary:"SELECT retrieves rows matching criteria. With an index, it's an O(log n) seek. Without, it's O(n) full table scan.", icon:"🔍" },
  "where-filtering":             { summary:"WHERE filters rows before returning them. Indexed columns use index seeks; non-indexed columns trigger full scans — much slower.", icon:"🔎" },
  "joins-inner-outer":           { summary:"INNER JOIN returns matching rows from both tables. LEFT OUTER JOIN returns all left rows, with NULLs for unmatched right rows.", icon:"🤝" },
  "index-usage-in-queries":      { summary:"The query planner decides whether to use an index or scan the table. Indexes shine for selective queries (few rows); scans win for low-selectivity.", icon:"📈" },
  "query-optimization-basics":   { summary:"Query optimizers use cost models (estimated I/Os) to choose join order, access methods, and push-down predicates. EXPLAIN shows the chosen plan.", icon:"⚡" },
};

function getIntroContent(slug, domain) {
  const base = INTRO_CONTENT[slug];
  if (base) return base;
  return {
    summary: domain === "os"
      ? "Simulate OS memory operations using ALLOC and FREE to master this concept."
      : "Use INSERT and SELECT (or CREATE / USE) to explore this DBMS concept.",
    icon: domain === "os" ? "⚙️" : "🗄️",
  };
}

// ─── Intro Modal ─────────────────────────────────────────────────────────────
function TopicIntroModal({ module, domain, config, onStart }) {
  const color   = config.color;
  const intro   = getIntroContent(module, domain);
  const label   = module?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Mission";

  return (
    <motion.div className="ti-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="ti-modal" style={{ "--tc": color }}
        initial={{ scale: 0.88, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", stiffness: 340, damping: 28 }}>

        <div className="ti-header">
          <div className="ti-icon-wrap"><span className="ti-icon">{intro.icon}</span></div>
          <div className="ti-header-text">
            <div className="ti-domain-tag" style={{ color }}>{domain?.toUpperCase()} — MISSION BRIEFING</div>
            <h2 className="ti-title">{label}</h2>
          </div>
        </div>

        <div className="ti-section">
          <div className="ti-section-label">📖 CONCEPT OVERVIEW</div>
          <p className="ti-summary" style={{ borderLeftColor: color }}>{intro.summary}</p>
        </div>

        <div className="ti-section">
          <div className="ti-section-label">🎯 YOUR OBJECTIVES</div>
          <ul className="ti-goals-preview">
            {config.goals.slice(0, 4).map((g, i) => (
              <li key={i} className="ti-goal-item">
                <span className="ti-goal-bullet" style={{ background: color }} />
                {g.text}
                <span className="ti-goal-xp" style={{ color }}>+{g.xp} XP</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="ti-section">
          <div className="ti-section-label">⌨️ COMMANDS</div>
          <div className="ti-cmd-grid">
            {config.commands.map((c, i) => (
              <div key={i} className="ti-cmd-row">
                <code className="ti-cmd" style={{ color }}>{c.cmd}</code>
                <span className="ti-cmd-desc">{c.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ti-hint-box">
          <span className="ti-hint-label">💡 Try first:</span> {config.terminalHint}
        </div>

        <button className="ti-start-btn" style={{ "--tc": color }} onClick={onStart}>
          ⚡ START MISSION
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Mission Complete Modal ───────────────────────────────────────────────────
function MissionCompleteModal({ domain, nextSlug, onClose, onNext }) {
  const color = domain === "os" ? "#00e5ff" : "#a855f7";
  const nextLabel = nextSlug?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <motion.div className="mc-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div className="mc-modal" style={{ "--mc": color }}
        initial={{ scale: 0.7, y: 60, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 26 }}>
        <div className="mc-burst">🎉</div>
        <h2 className="mc-title">MISSION COMPLETE</h2>
        <p className="mc-subtitle">All objectives achieved!</p>
        <div className="mc-stats">
          <div className="mc-stat"><span className="mc-stat-label">STATUS</span><span className="mc-stat-val" style={{ color }}>✓ SECURED</span></div>
          <div className="mc-stat"><span className="mc-stat-label">PROGRESS</span><span className="mc-stat-val" style={{ color }}>XP EARNED</span></div>
        </div>
        <p className="mc-flavor">Your mastery score has been updated. The system is ready for the next challenge.</p>
        <div className="mc-actions">
          {nextSlug && (
            <button className="mc-next-btn" style={{ "--mc": color }} onClick={onNext}>
              ⚡ Next: {nextLabel} →
            </button>
          )}
          <button className="mc-close-btn" style={{ "--mc": color }} onClick={onClose}>
            {nextSlug ? "Stay here" : "↺ Replay"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── In-game Command Cheatsheet ───────────────────────────────────────────────
function CommandGuide({ commands, color }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="cmd-guide">
      <button className="cmd-guide-toggle" onClick={() => setOpen(o => !o)} style={{ "--cg": color }}>
        📋 <span>Commands</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="cmd-guide-panel"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="cmd-guide-header">Command Reference</div>
            {commands.map((c, i) => (
              <div key={i} className="cmd-guide-row">
                <code className="cmd-guide-cmd" style={{ color }}>{c.cmd}</code>
                <span className="cmd-guide-desc">{c.desc}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Auto-feedback Banner ─────────────────────────────────────────────────────
function FeedbackBanner({ message, onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 9000); return () => clearTimeout(t); }, [onDismiss]);
  return (
    <motion.div className="fb-banner" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <span className="fb-icon">🤖</span>
      <p className="fb-msg">{message}</p>
      <button className="fb-dismiss" onClick={onDismiss}>✕</button>
    </motion.div>
  );
}

// ─── Main GameShell ───────────────────────────────────────────────────────────
export default function GameShell() {
  const { domain, module } = useParams();
  const navigate = useNavigate();

  const config   = getTopicConfig(module);
  const color    = config.color;
  const nextSlug = getNextTopic(domain, module);

  const [showIntro, setShowIntro]       = useState(true);
  const [showComplete, setShowComplete] = useState(false);
  const [feedbackMsg, setFeedbackMsg]   = useState(null);
  const completeFiredRef                = useRef(false);
  const feedbackCooldownRef             = useRef(false);

  const sessionId   = useGameStore(s => s.sessionId);
  const dbmsGoals   = useGameStore(s => s.goals ?? []);
  const osGoals     = useGameStore1(s => s.goals ?? []);
  const osHistory   = useGameStore1(s => s.commandHistory ?? []);
  const dbmsHistory = useGameStore(s => s.commandHistory ?? []);
  const resetOS     = useGameStore1(s => s.resetSession);
  const resetDBMS   = useGameStore(s => s.resetSession);

  const markTopicComplete = useProgressStore(s => s.markTopicComplete);

  const goals   = domain === "os" ? osGoals   : dbmsGoals;
  const history = domain === "os" ? osHistory : dbmsHistory;

  // ── Reset on every mount (new topic or replay) ───────────────────────────
  useEffect(() => {
    completeFiredRef.current = false;
    setShowComplete(false);
    setShowIntro(true);
    if (domain === "os") resetOS?.(module);
    else resetDBMS?.(module);
  }, [domain, module]);

  // ── Completion detection ─────────────────────────────────────────────────
  useEffect(() => {
    if (completeFiredRef.current) return;
    if (goals.length > 0 && goals.every(g => g.completed)) {
      completeFiredRef.current = true;
      if (module) markTopicComplete(module);
      setTimeout(() => setShowComplete(true), 600);
    }
  }, [goals, module, markTopicComplete]);

  // ── Auto-feedback on 3 consecutive errors ────────────────────────────────
  const fetchAutoFeedback = useCallback(async () => {
    if (feedbackCooldownRef.current) return;
    feedbackCooldownRef.current = true;
    try {
      const res = await apiClient.get("/game/adaptive/hint", {
        params: { session_token: sessionId || "", challenge_slug: module || "", hint_level: 1 },
      });
      setFeedbackMsg(res.data?.hint?.message || config.terminalHint);
    } catch {
      setFeedbackMsg(`Tip: ${config.terminalHint}`);
    }
    setTimeout(() => { feedbackCooldownRef.current = false; }, 30000);
  }, [sessionId, module, config]);

  useEffect(() => {
    if (history.length < 3) return;
    const recentFails = history.slice(-3).filter(
      e => ["failed","not found","invalid","error","unknown"].some(w => e.output?.toLowerCase().includes(w))
    );
    if (recentFails.length >= 3) fetchAutoFeedback();
  }, [history, fetchAutoFeedback]);

  const handleNext = () => {
    setShowComplete(false);
    navigate(`/game/${domain}/${nextSlug}`);
  };

  // Decide which simulator to show
  const sim = config.simulator;

  return (
    <>
      <Navbar />
      <XPHud />

      <AnimatePresence>
        {showIntro && <TopicIntroModal module={module} domain={domain} config={config} onStart={() => setShowIntro(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showComplete && <MissionCompleteModal domain={domain} nextSlug={nextSlug} onClose={() => setShowComplete(false)} onNext={handleNext} />}
      </AnimatePresence>
      <AnimatePresence>
        {feedbackMsg && <FeedbackBanner message={feedbackMsg} onDismiss={() => setFeedbackMsg(null)} />}
      </AnimatePresence>

      <div className="game-container">
        <div className="left-panel">
          {sim === SIMULATOR.BTREE ? (
            <div className="dbms-workspace">
              <div className="tree-canvas"><BTreeVisualizer /></div>
              <div className="details-sidebar"><TableInspector /></div>
            </div>
          ) : sim === SIMULATOR.SCHEMA ? (
            <div className="dbms-workspace">
              <div className="tree-canvas" style={{ flex: 1 }}>
                <div className="schema-placeholder">
                  <div className="schema-icon">🗄️</div>
                  <div className="schema-title">Schema Builder</div>
                  <div className="schema-hint">Use CREATE DATABASE, USE, and CREATE TABLE in the terminal below</div>
                </div>
              </div>
              <div className="details-sidebar"><TableInspector /></div>
            </div>
          ) : (
            <MemoryMap />
          )}
        </div>

        <div className="right-panel">
          <GoalPanel />
          <CommandGuide commands={config.commands} color={color} />
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
