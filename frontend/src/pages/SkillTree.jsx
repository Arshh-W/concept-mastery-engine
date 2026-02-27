/**
 * SkillTree.jsx
 * Visual competency/skill tree as the main game screen.
 * Renders the DAG of OS and DBMS topics, locked/unlocked/mastered states.
 * Clicking a node opens a MissionIntro modal.
 */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "../components/navbar";
import useProgressStore, {
  getDomainLevel,
  getLevelForXP,
  getXPToNextLevel,
} from "../store/useProgressStore";
import { gameApi } from "../services/api";
import MissionIntro from "../components/MissionIntro";
import "./SkillTree.css";

// Static skill tree definition
// In a real system this would come from GET /game/challenges/
const SKILL_TREE = {
  OS: {
    label: "Operating Systems",
    icon: "⚙️",
    color: "#06b6d4",
    nodes: [
      {
        id: "os_processes_01",
        slug: "os_processes",
        name: "Processes",
        icon: "⚡",
        description: "Process lifecycle, states, and PCB structure",
        prerequisites: [],
        dag_level: 0,
        difficulty: 1,
        xp: 50,
        route: "/game/os/processes",
        challenge_slug: "os_processes_01",
      },
      {
        id: "os_scheduling_01",
        slug: "os_scheduling",
        name: "CPU Scheduling",
        icon: "📅",
        description: "FCFS, SJF, Round-Robin scheduling algorithms",
        prerequisites: ["os_processes"],
        dag_level: 1,
        difficulty: 2,
        xp: 75,
        route: "/game/os/scheduling",
        challenge_slug: "os_scheduling_01",
      },
      {
        id: "os_context_01",
        slug: "os_context_switch",
        name: "Context Switching",
        icon: "🔄",
        description: "How the OS swaps between processes",
        prerequisites: ["os_scheduling"],
        dag_level: 2,
        difficulty: 2,
        xp: 75,
        route: "/game/os/context",
        challenge_slug: "os_context_01",
      },
      {
        id: "os_memory_01",
        slug: "os_memory",
        name: "Memory Basics",
        icon: "🧩",
        description: "Address spaces, segmentation, allocation strategies",
        prerequisites: ["os_processes"],
        dag_level: 1,
        difficulty: 2,
        xp: 75,
        route: "/os/memory",
        challenge_slug: "os_mem_01",
      },
      {
        id: "os_paging_01",
        slug: "os_paging",
        name: "Paging",
        icon: "📄",
        description: "Page tables, TLBs, page replacement algorithms",
        prerequisites: ["os_memory"],
        dag_level: 2,
        difficulty: 3,
        xp: 100,
        route: "/game/os/paging",
        challenge_slug: "os_page_01",
      },
      {
        id: "os_virtual_01",
        slug: "os_virtual_mem",
        name: "Virtual Memory",
        icon: "🌐",
        description: "Demand paging, swap space, working set model",
        prerequisites: ["os_paging"],
        dag_level: 3,
        difficulty: 4,
        xp: 125,
        route: "/game/os/virtual",
        challenge_slug: "os_virtual_01",
      },
      {
        id: "os_sync_01",
        slug: "os_sync",
        name: "Synchronization",
        icon: "🔒",
        description: "Mutexes, semaphores, monitors, deadlock",
        prerequisites: ["os_context_switch"],
        dag_level: 3,
        difficulty: 4,
        xp: 125,
        route: "/game/os/sync",
        challenge_slug: "os_sync_01",
      },
    ],
  },
  DBMS: {
    label: "Database Systems",
    icon: "🗄️",
    color: "#8b5cf6",
    nodes: [
      {
        id: "dbms_relational_01",
        slug: "dbms_relational",
        name: "Relational Model",
        icon: "📊",
        description: "Tables, keys, relational algebra fundamentals",
        prerequisites: [],
        dag_level: 0,
        difficulty: 1,
        xp: 50,
        route: "/game/dbms/relational",
        challenge_slug: "dbms_rel_01",
      },
      {
        id: "dbms_sql_01",
        slug: "dbms_sql",
        name: "SQL Queries",
        icon: "💬",
        description: "SELECT, JOIN, GROUP BY, subqueries",
        prerequisites: ["dbms_relational"],
        dag_level: 1,
        difficulty: 2,
        xp: 75,
        route: "/game/dbms/sql",
        challenge_slug: "dbms_sql_01",
      },
      {
        id: "dbms_indexing_01",
        slug: "dbms_indexing",
        name: "Indexing",
        icon: "🔍",
        description: "B+ trees, hash indexes, composite indexes",
        prerequisites: ["dbms_sql"],
        dag_level: 2,
        difficulty: 3,
        xp: 100,
        route: "/game/dbms/indexing",
        challenge_slug: "dbms_idx_01",
      },
      {
        id: "dbms_btree_01",
        slug: "dbms_btree",
        name: "B+ Tree Operations",
        icon: "🌳",
        description: "Insert, delete, split operations on B+ trees",
        prerequisites: ["dbms_indexing"],
        dag_level: 3,
        difficulty: 4,
        xp: 125,
        route: "/game/dbms/btree",
        challenge_slug: "dbms_btree_01",
      },
      {
        id: "dbms_transactions_01",
        slug: "dbms_transactions",
        name: "Transactions",
        icon: "💳",
        description: "ACID properties, isolation levels, commit/rollback",
        prerequisites: ["dbms_sql"],
        dag_level: 2,
        difficulty: 3,
        xp: 100,
        route: "/game/dbms/transactions",
        challenge_slug: "dbms_txn_01",
      },
      {
        id: "dbms_concurrency_01",
        slug: "dbms_concurrency",
        name: "Concurrency Control",
        icon: "⚡",
        description: "Locking, MVCC, deadlock detection in DBs",
        prerequisites: ["dbms_transactions"],
        dag_level: 3,
        difficulty: 4,
        xp: 125,
        route: "/game/dbms/concurrency",
        challenge_slug: "dbms_cc_01",
      },
      {
        id: "dbms_normalization_01",
        slug: "dbms_normalization",
        name: "Normalization",
        icon: "📐",
        description: "1NF through BCNF, functional dependencies",
        prerequisites: ["dbms_relational"],
        dag_level: 1,
        difficulty: 2,
        xp: 75,
        route: "/game/dbms/normalization",
        challenge_slug: "dbms_norm_01",
      },
    ],
  },
};

export default function SkillTree() {
  const [activeDomain, setActiveDomain] = useState("OS");
  const [selectedNode, setSelectedNode] = useState(null);
  const [showMission, setShowMission] = useState(false);

  const { masteryMap, totalXP, syncFromBackend } = useProgressStore();

  useEffect(() => {
    syncFromBackend();
  }, []);

  const level = getLevelForXP(totalXP);
  const { progress: xpProgress } = getXPToNextLevel(totalXP);

  const domain = SKILL_TREE[activeDomain];

  // Determine node status
  const getNodeStatus = (node) => {
    const mastery = masteryMap[node.slug] ?? 0;
    if (mastery >= 0.8) return "mastered";
    if (mastery > 0.3) return "in_progress";

    // Check if prerequisites are met
    const prereqsMet = node.prerequisites.every(prereq => {
      const p = masteryMap[prereq] ?? 0;
      return p >= 0.4; // 40% = unlocked threshold
    });
    if (prereqsMet || node.prerequisites.length === 0) return "available";
    return "locked";
  };

  const getMasteryPercent = (node) => {
    const p = masteryMap[node.slug] ?? 0;
    return Math.round(p * 100);
  };

  const domainMasteryAvg = (domainKey) => {
    const nodes = SKILL_TREE[domainKey].nodes;
    if (!nodes.length) return 0;
    const total = nodes.reduce((acc, n) => acc + (masteryMap[n.slug] ?? 0), 0);
    return Math.round((total / nodes.length) * 100);
  };

  const handleNodeClick = (node) => {
    const status = getNodeStatus(node);
    if (status === "locked") return;
    setSelectedNode(node);
    setShowMission(true);
  };

  // Group nodes by dag_level for column layout
  const levelGroups = {};
  domain.nodes.forEach(n => {
    if (!levelGroups[n.dag_level]) levelGroups[n.dag_level] = [];
    levelGroups[n.dag_level].push(n);
  });

  return (
    <div className="skill-tree-page">
      <Navbar />

      <div className="skill-tree-layout">
        {/* Left Sidebar - Player Card */}
        <aside className="skill-sidebar">
          <div className="player-card">
            <div className="player-avatar">{level.icon}</div>
            <div className="player-level-name" style={{ color: level.color }}>{level.name}</div>
            <div className="player-xp">{totalXP.toLocaleString()} XP</div>
            <div className="player-xp-bar">
              <div className="player-xp-fill" style={{ width: `${xpProgress}%`, background: level.color }} />
            </div>
          </div>

          {/* Domain Cards */}
          {Object.entries(SKILL_TREE).map(([key, dom]) => {
            const avg = domainMasteryAvg(key);
            const dl = getDomainLevel(avg / 100);
            return (
              <button
                key={key}
                className={`domain-card ${activeDomain === key ? "active" : ""}`}
                style={{ "--domain-color": dom.color }}
                onClick={() => setActiveDomain(key)}
              >
                <span className="domain-icon">{dom.icon}</span>
                <div className="domain-info">
                  <div className="domain-name">{dom.label}</div>
                  <div className="domain-level">{dl.name} • {avg}%</div>
                </div>
                <div className="domain-bar">
                  <div className="domain-bar-fill" style={{ width: `${avg}%` }} />
                </div>
              </button>
            );
          })}

          <Link to="/roadmap" className="back-link">← Domain Select</Link>
        </aside>

        {/* Main Tree Canvas */}
        <main className="skill-tree-canvas">
          <div className="tree-header">
            <h1 className="tree-title" style={{ color: domain.color }}>
              {domain.icon} {domain.label}
            </h1>
            <p className="tree-subtitle">Skill Progression Tree</p>
          </div>

          <div className="tree-columns">
            {Object.entries(levelGroups)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([level, nodes]) => (
                <div key={level} className="tree-column">
                  <div className="tree-column-label">Level {Number(level) + 1}</div>
                  <div className="tree-column-nodes">
                    {nodes.map((node) => {
                      const status = getNodeStatus(node);
                      const pct = getMasteryPercent(node);
                      return (
                        <motion.button
                          key={node.id}
                          className={`skill-node node-${status}`}
                          style={{
                            "--domain-color": domain.color,
                            "--mastery": `${pct}%`,
                          }}
                          whileHover={status !== "locked" ? { scale: 1.04, y: -2 } : {}}
                          whileTap={status !== "locked" ? { scale: 0.97 } : {}}
                          onClick={() => handleNodeClick(node)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: node.dag_level * 0.1 }}
                        >
                          {/* Lock overlay */}
                          {status === "locked" && (
                            <div className="node-lock-overlay">🔒</div>
                          )}

                          <div className="node-icon">{node.icon}</div>
                          <div className="node-name">{node.name}</div>
                          <div className="node-desc">{node.description}</div>

                          {/* Mastery ring */}
                          <div className="node-mastery-bar">
                            <div className="node-mastery-fill" />
                            <span className="node-mastery-pct">{pct}%</span>
                          </div>

                          {/* Difficulty dots */}
                          <div className="node-difficulty">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={`diff-dot ${i < node.difficulty ? "active" : ""}`}
                              />
                            ))}
                          </div>

                          {/* XP badge */}
                          <div className="node-xp-badge">+{node.xp} XP</div>

                          {status === "mastered" && (
                            <div className="node-mastered-badge">✓ MASTERED</div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>

          {/* Connector lines between levels (decorative) */}
          <div className="tree-legend">
            <span className="legend-item locked-legend">🔒 Locked</span>
            <span className="legend-item available-legend">◆ Available</span>
            <span className="legend-item progress-legend">◉ In Progress</span>
            <span className="legend-item mastered-legend">✓ Mastered</span>
          </div>
        </main>
      </div>

      {/* Mission Intro Modal */}
      <AnimatePresence>
        {showMission && selectedNode && (
          <MissionIntro
            node={selectedNode}
            status={getNodeStatus(selectedNode)}
            mastery={getMasteryPercent(selectedNode)}
            domainColor={domain.color}
            onClose={() => setShowMission(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
