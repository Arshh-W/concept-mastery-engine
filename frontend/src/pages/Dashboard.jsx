/**
 * Dashboard.jsx — Live concept mastery tracking.
 *
 * Mastery is sourced from TWO places and merged:
 *   1. useProgressStore.completedTopics  — local, updated immediately on level complete
 *   2. useProgressStore.masteryMap       — BKT mastery from backend (keyed by competency slug)
 *
 * A SLUG_TO_COMPETENCY map bridges frontend topic slugs → backend competency slugs
 * so BKT mastery (0-1) shows correctly on every topic card.
 *
 * The dashboard re-reads the store live (Zustand subscription), so finishing a level
 * in another tab or returning from game immediately reflects here.
 */
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import useProgressStore, {
  getLevelForXP,
  getXPToNextLevel,
  getDomainLevel,
  LEVEL_TIERS,
  DOMAIN_LEVELS,
  BADGES,
  XP_REWARDS,
} from "../store/useProgressStore";
import { gameApi } from "../services/api";
import "./Dashboard.css";

// ── Slug → backend competency mapping ────────────────────────────────────────
// Frontend topic slug → backend BKT competency slug
// This lets us show real mastery percentages on every card.
const SLUG_TO_COMPETENCY = {
  // OS — fundamentals map to os_fundamentals
  "what-is-an-operating-system": "os_fundamentals",
  "kernel-vs-user-mode":         "os_fundamentals",
  "system-calls":                "os_fundamentals",
  "os-architecture":             "os_fundamentals",
  // OS — process
  "process-vs-program":          "os_process",
  "process-states":              "os_process",
  "context-switching":           "os_process",
  "cpu-scheduling---fcfs":       "os_process",
  "round-robin":                 "os_process",
  // OS — memory
  "contiguous-allocation":       "os_memory",
  "paging":                      "os_memory",
  "segmentation":                "os_memory",
  "virtual-memory":              "os_memory",
  "page-replacement---lru":      "os_memory",
  // OS — sync
  "critical-section":            "os_sync",
  "mutex":                       "os_sync",
  "semaphores":                  "os_sync",
  "deadlock":                    "os_sync",
  "bankers-algorithm":           "os_sync",
  // OS — file systems
  "inodes":                      "os_filesystems",
  "disk-scheduling---fcfs":      "os_filesystems",
  "scan":                        "os_filesystems",
  "c-scan":                      "os_filesystems",
  // DBMS — fundamentals
  "what-is-dbms":                "dbms_fundamentals",
  "database-architecture":       "dbms_fundamentals",
  "advantages-of-dbms":          "dbms_fundamentals",
  "types-of-databases":          "dbms_fundamentals",
  // DBMS — relational
  "relational-model":            "dbms_relational",
  "er-model":                    "dbms_relational",
  "functional-dependencies":     "dbms_relational",
  "1nf-/-2nf-/-3nf":             "dbms_relational",
  "bcnf":                        "dbms_relational",
  // DBMS — transactions
  "transactions":                "dbms_transactions",
  "acid-properties":             "dbms_transactions",
  "concurrency-problems":        "dbms_transactions",
  "locks-and-2pl":               "dbms_transactions",
  "deadlocks":                   "dbms_transactions",
  // DBMS — indexing (B-tree / B+ tree)
  "binary-search-tree":          "dbms_indexing",
  "b-tree":                      "dbms_indexing",
  "b+-tree":                     "dbms_indexing",
  "node-splitting":              "dbms_indexing",
  "traversal-paths":             "dbms_indexing",
  // DBMS — query opt
  "select-statement":            "dbms_query_opt",
  "where-filtering":             "dbms_query_opt",
  "joins-inner-outer":           "dbms_query_opt",
  "index-usage-in-queries":      "dbms_query_opt",
  "query-optimization-basics":   "dbms_query_opt",
};

// Completed topics also boost mastery. This is the floor mastery for a completed topic.
const COMPLETED_MASTERY_FLOOR = 0.6;

// All displayable topics
const ALL_TOPICS = {
  // OS
  "what-is-an-operating-system": { label: "What is an OS?",          domain: "os",   group: "Fundamentals"  },
  "kernel-vs-user-mode":         { label: "Kernel vs User Mode",      domain: "os",   group: "Fundamentals"  },
  "system-calls":                { label: "System Calls",             domain: "os",   group: "Fundamentals"  },
  "process-vs-program":          { label: "Process vs Program",       domain: "os",   group: "Processes"     },
  "process-states":              { label: "Process States",           domain: "os",   group: "Processes"     },
  "context-switching":           { label: "Context Switching",        domain: "os",   group: "Processes"     },
  "cpu-scheduling---fcfs":       { label: "CPU Scheduling (FCFS)",    domain: "os",   group: "Processes"     },
  "round-robin":                 { label: "Round Robin",              domain: "os",   group: "Processes"     },
  "contiguous-allocation":       { label: "Contiguous Allocation",    domain: "os",   group: "Memory"        },
  "paging":                      { label: "Paging",                   domain: "os",   group: "Memory"        },
  "segmentation":                { label: "Segmentation",             domain: "os",   group: "Memory"        },
  "virtual-memory":              { label: "Virtual Memory",           domain: "os",   group: "Memory"        },
  "page-replacement---lru":      { label: "Page Replacement (LRU)",   domain: "os",   group: "Memory"        },
  "critical-section":            { label: "Critical Section",         domain: "os",   group: "Sync"          },
  "mutex":                       { label: "Mutex",                    domain: "os",   group: "Sync"          },
  "semaphores":                  { label: "Semaphores",               domain: "os",   group: "Sync"          },
  "deadlock":                    { label: "Deadlock",                 domain: "os",   group: "Sync"          },
  "inodes":                      { label: "Inodes",                   domain: "os",   group: "File Systems"  },
  "disk-scheduling---fcfs":      { label: "Disk Scheduling (FCFS)",   domain: "os",   group: "File Systems"  },
  // DBMS
  "what-is-dbms":                { label: "What is DBMS?",            domain: "dbms", group: "Fundamentals"  },
  "database-architecture":       { label: "DB Architecture",          domain: "dbms", group: "Fundamentals"  },
  "relational-model":            { label: "Relational Model",         domain: "dbms", group: "Relational"    },
  "er-model":                    { label: "ER Model",                 domain: "dbms", group: "Relational"    },
  "functional-dependencies":     { label: "Functional Dependencies",  domain: "dbms", group: "Relational"    },
  "1nf-/-2nf-/-3nf":             { label: "1NF / 2NF / 3NF",         domain: "dbms", group: "Relational"    },
  "bcnf":                        { label: "BCNF",                     domain: "dbms", group: "Relational"    },
  "transactions":                { label: "Transactions",             domain: "dbms", group: "Transactions"  },
  "acid-properties":             { label: "ACID Properties",          domain: "dbms", group: "Transactions"  },
  "concurrency-problems":        { label: "Concurrency Problems",     domain: "dbms", group: "Transactions"  },
  "locks-and-2pl":               { label: "Locks & 2PL",             domain: "dbms", group: "Transactions"  },
  "deadlocks":                   { label: "DB Deadlocks",             domain: "dbms", group: "Transactions"  },
  "binary-search-tree":          { label: "Binary Search Tree",       domain: "dbms", group: "Indexing"      },
  "b-tree":                      { label: "B-Tree",                   domain: "dbms", group: "Indexing"      },
  "b+-tree":                     { label: "B+ Tree",                  domain: "dbms", group: "Indexing"      },
  "node-splitting":              { label: "Node Splitting",           domain: "dbms", group: "Indexing"      },
  "traversal-paths":             { label: "Traversal Paths",          domain: "dbms", group: "Indexing"      },
  "select-statement":            { label: "SELECT Statement",         domain: "dbms", group: "Query Opt"     },
  "where-filtering":             { label: "WHERE Filtering",          domain: "dbms", group: "Query Opt"     },
  "joins-inner-outer":           { label: "Joins (Inner/Outer)",      domain: "dbms", group: "Query Opt"     },
  "index-usage-in-queries":      { label: "Index Usage in Queries",   domain: "dbms", group: "Query Opt"     },
  "query-optimization-basics":   { label: "Query Optimization",       domain: "dbms", group: "Query Opt"     },
};

const OS_COLOR   = "#00e5ff";
const DBMS_COLOR = "#a855f7";

// Resolve mastery for a frontend slug — merges BKT map + completed topics
function resolveMastery(slug, masteryMap, completedTopics) {
  const competency = SLUG_TO_COMPETENCY[slug];
  const bktVal     = competency ? (masteryMap[competency] ?? 0) : 0;
  const completed  = completedTopics.includes(slug);
  // Take the max: BKT value OR the floor if topic is completed
  return completed ? Math.max(bktVal, COMPLETED_MASTERY_FLOOR) : bktVal;
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Live Zustand subscriptions — auto-updates when game store changes
  const totalXP        = useProgressStore(s => s.totalXP);
  const streak         = useProgressStore(s => s.streak);
  const earnedBadges   = useProgressStore(s => s.earnedBadges);
  const masteryMap     = useProgressStore(s => s.masteryMap);
  const completedTopics = useProgressStore(s => s.completedTopics);
  const syncFromBackend = useProgressStore(s => s.syncFromBackend);

  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState("os"); // "os" | "dbms"
  const [lastSync, setLastSync]   = useState(null);

  const level                              = getLevelForXP(totalXP);
  const { progress: xpPct, needed, nextLevel } = getXPToNextLevel(totalXP);

  // Sync from backend on mount and every 30s
  const doSync = useCallback(async () => {
    try {
      await syncFromBackend();
      setLastSync(new Date());
    } catch {}
    setLoading(false);
  }, [syncFromBackend]);

  useEffect(() => {
    doSync();
    const interval = setInterval(doSync, 30000);
    return () => clearInterval(interval);
  }, [doSync]);

  // Compute per-domain stats
  const osTopics   = Object.entries(ALL_TOPICS).filter(([, v]) => v.domain === "os");
  const dbmsTopics = Object.entries(ALL_TOPICS).filter(([, v]) => v.domain === "dbms");

  const osMasteries   = osTopics.map(([s])   => resolveMastery(s, masteryMap, completedTopics));
  const dbmsMasteries = dbmsTopics.map(([s]) => resolveMastery(s, masteryMap, completedTopics));

  const osAvgRaw   = osMasteries.reduce((a, b) => a + b, 0)   / Math.max(osTopics.length, 1);
  const dbmsAvgRaw = dbmsMasteries.reduce((a, b) => a + b, 0) / Math.max(dbmsTopics.length, 1);
  const osAvg      = Math.round(osAvgRaw   * 100);
  const dbmsAvg    = Math.round(dbmsAvgRaw * 100);

  const osDomLevel   = getDomainLevel(osAvgRaw);
  const dbmsDomLevel = getDomainLevel(dbmsAvgRaw);

  const osCompleted   = osTopics.filter(([s])   => completedTopics.includes(s)).length;
  const dbmsCompleted = dbmsTopics.filter(([s]) => completedTopics.includes(s)).length;
  const totalCompleted = completedTopics.length;

  // Group topics by their group label for grouped display
  function groupTopics(topics) {
    const groups = {};
    for (const [slug, info] of topics) {
      if (!groups[info.group]) groups[info.group] = [];
      groups[info.group].push([slug, info]);
    }
    return groups;
  }

  const osGroups   = groupTopics(osTopics);
  const dbmsGroups = groupTopics(dbmsTopics);
  const activeGroups = activeTab === "os" ? osGroups : dbmsGroups;
  const activeColor  = activeTab === "os" ? OS_COLOR  : DBMS_COLOR;

  return (
    <div className="dash-page">
      <Navbar />

      <div className="dash-layout">

        {/* ── Sidebar ── */}
        <aside className="dash-sidebar">
          <motion.div
            className="dash-player-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ "--lc": level.color }}
          >
            <div className="dash-avatar" style={{ filter: `drop-shadow(0 0 16px ${level.color})` }}>
              {level.icon}
            </div>
            <div className="dash-level-name" style={{ color: level.color }}>{level.name}</div>
            <div className="dash-xp">{totalXP.toLocaleString()} XP</div>
            <div className="dash-xp-track">
              <motion.div
                className="dash-xp-fill"
                style={{ background: level.color, boxShadow: `0 0 8px ${level.color}` }}
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
            {nextLevel && (
              <div className="dash-xp-next">+{needed.toLocaleString()} XP → {nextLevel.name}</div>
            )}
          </motion.div>

          {/* Stats row */}
          <div className="dash-stats-row">
            <div className="dash-stat-pill">
              <span className="dsp-icon">🔥</span>
              <span className="dsp-val">{streak}</span>
              <span className="dsp-label">Day Streak</span>
            </div>
            <div className="dash-stat-pill">
              <span className="dsp-icon">✅</span>
              <span className="dsp-val">{totalCompleted}</span>
              <span className="dsp-label">Completed</span>
            </div>
          </div>

          {/* XP rewards info */}
          <div className="dash-xp-guide">
            <div className="dash-section-label">XP REWARDS</div>
            <div className="dash-xp-row"><span>Level complete</span><span className="dash-xp-val">+{XP_REWARDS.LEVEL_COMPLETE}</span></div>
            <div className="dash-xp-row"><span>Perfect run</span><span className="dash-xp-val">+{XP_REWARDS.PERFECT_SCORE}</span></div>
            <div className="dash-xp-row"><span>First ever</span><span className="dash-xp-val">+{XP_REWARDS.FIRST_COMPLETE}</span></div>
            <div className="dash-xp-row"><span>Streak bonus</span><span className="dash-xp-val">+{XP_REWARDS.STREAK_BONUS}</span></div>
            <div className="dash-xp-row"><span>Level-up bonus</span><span className="dash-xp-val">varies</span></div>
          </div>

          {/* Level tiers */}
          <div className="dash-tier-ladder">
            <div className="dash-section-label">LEVEL TIERS</div>
            {LEVEL_TIERS.map((tier) => {
              const active   = level.level === tier.level;
              const unlocked = totalXP >= tier.minXP;
              return (
                <div
                  key={tier.level}
                  className={`dash-tier ${active ? "dash-tier--active" : ""} ${!unlocked ? "dash-tier--locked" : ""}`}
                  style={{ "--tc": tier.color }}
                >
                  <span className="dash-tier-icon">{tier.icon}</span>
                  <div className="dash-tier-info">
                    <div className="dash-tier-name">{tier.name}</div>
                    <div className="dash-tier-xp">{tier.minXP.toLocaleString()} XP {tier.bonus > 0 ? `· +${tier.bonus} bonus` : ""}</div>
                  </div>
                  {active && <span className="dash-tier-current">← YOU</span>}
                </div>
              );
            })}
          </div>

          {lastSync && (
            <div className="dash-sync-time">
              Synced {lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </aside>

        {/* ── Main content ── */}
        <main className="dash-main">
          <div className="dash-top-header">
            <h1 className="dash-title">Concept Mastery</h1>
            <p className="dash-subtitle">
              {loading ? "Syncing with server…" : `${totalCompleted} topics completed · live BKT tracking`}
            </p>
          </div>

          {/* Domain summary cards */}
          <div className="dash-domain-cards">
            <motion.div
              className={`dash-domain-card ${activeTab === "os" ? "dash-domain-card--active" : ""}`}
              style={{ "--dc": OS_COLOR }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setActiveTab("os")}
            >
              <div className="ddc-icon">⚙️</div>
              <div className="ddc-info">
                <div className="ddc-title">Operating Systems</div>
                <div className="ddc-level" style={{ color: OS_COLOR }}>{osDomLevel.name}</div>
                <div className="ddc-sub">{osCompleted}/{osTopics.length} topics done</div>
              </div>
              <div className="ddc-right">
                <div className="ddc-pct" style={{ color: OS_COLOR }}>{osAvg}%</div>
                <div className="ddc-bar-track">
                  <motion.div className="ddc-bar-fill"
                    style={{ background: OS_COLOR }}
                    initial={{ width: 0 }}
                    animate={{ width: `${osAvg}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }} />
                </div>
                <div className="ddc-domain-level-dots">
                  {DOMAIN_LEVELS.map((dl, i) => (
                    <div
                      key={i}
                      className="ddc-level-dot"
                      style={{
                        background: osAvgRaw >= dl.threshold ? OS_COLOR : "rgba(255,255,255,0.1)",
                        boxShadow:  osAvgRaw >= dl.threshold ? `0 0 4px ${OS_COLOR}` : "none",
                      }}
                      title={dl.name}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              className={`dash-domain-card ${activeTab === "dbms" ? "dash-domain-card--active" : ""}`}
              style={{ "--dc": DBMS_COLOR }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setActiveTab("dbms")}
            >
              <div className="ddc-icon">🗄️</div>
              <div className="ddc-info">
                <div className="ddc-title">Database Systems</div>
                <div className="ddc-level" style={{ color: DBMS_COLOR }}>{dbmsDomLevel.name}</div>
                <div className="ddc-sub">{dbmsCompleted}/{dbmsTopics.length} topics done</div>
              </div>
              <div className="ddc-right">
                <div className="ddc-pct" style={{ color: DBMS_COLOR }}>{dbmsAvg}%</div>
                <div className="ddc-bar-track">
                  <motion.div className="ddc-bar-fill"
                    style={{ background: DBMS_COLOR }}
                    initial={{ width: 0 }}
                    animate={{ width: `${dbmsAvg}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }} />
                </div>
                <div className="ddc-domain-level-dots">
                  {DOMAIN_LEVELS.map((dl, i) => (
                    <div
                      key={i}
                      className="ddc-level-dot"
                      style={{
                        background: dbmsAvgRaw >= dl.threshold ? DBMS_COLOR : "rgba(255,255,255,0.1)",
                        boxShadow:  dbmsAvgRaw >= dl.threshold ? `0 0 4px ${DBMS_COLOR}` : "none",
                      }}
                      title={dl.name}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tab switcher */}
          <div className="dash-tab-bar">
            <button
              className={`dash-tab ${activeTab === "os" ? "dash-tab--active" : ""}`}
              style={{ "--tc": OS_COLOR }}
              onClick={() => setActiveTab("os")}
            >⚙️ OS Topics ({osCompleted}/{osTopics.length})</button>
            <button
              className={`dash-tab ${activeTab === "dbms" ? "dash-tab--active" : ""}`}
              style={{ "--tc": DBMS_COLOR }}
              onClick={() => setActiveTab("dbms")}
            >🗄️ DBMS Topics ({dbmsCompleted}/{dbmsTopics.length})</button>
          </div>

          {/* Topic groups */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="dash-topics-section"
            >
              {Object.entries(activeGroups).map(([groupName, topics]) => (
                <div key={groupName} className="dash-topic-group">
                  <div className="dash-topic-group-header">
                    <span className="dash-topic-group-name" style={{ color: activeColor }}>
                      {groupName}
                    </span>
                    <span className="dash-topic-group-count">
                      {topics.filter(([s]) => completedTopics.includes(s)).length}/{topics.length}
                    </span>
                  </div>
                  <div className="dash-topic-grid">
                    {topics.map(([slug, info], i) => {
                      const mastery  = resolveMastery(slug, masteryMap, completedTopics);
                      const pct      = Math.round(mastery * 100);
                      const done     = completedTopics.includes(slug);
                      const inProg   = pct > 0 && !done;
                      const domain   = activeTab;
                      return (
                        <motion.div
                          key={slug}
                          className={`dash-topic-card ${done ? "dash-topic-card--done" : ""} ${inProg ? "dash-topic-card--inprog" : ""}`}
                          style={{ "--tc": activeColor }}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          onClick={() => navigate(`/game/${domain}/${slug}`)}
                        >
                          <div className="dtc-header">
                            <span className="dtc-label">{info.label}</span>
                            {done  && <span className="dtc-status dtc-status--done">✓</span>}
                            {inProg && !done && <span className="dtc-status dtc-status--prog">…</span>}
                          </div>

                          {/* Mastery bar */}
                          <div className="dtc-bar-track">
                            <motion.div
                              className="dtc-bar-fill"
                              style={{
                                background: pct >= 80 ? "#00ff88" : pct >= 55 ? activeColor : pct >= 35 ? "#ffaa00" : "#ff4060",
                                boxShadow: pct > 0 ? `0 0 6px ${pct >= 80 ? "#00ff88" : activeColor}55` : "none",
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: i * 0.03 }}
                            />
                          </div>

                          <div className="dtc-footer">
                            <span className="dtc-pct" style={{
                              color: pct >= 80 ? "#00ff88" : pct >= 55 ? activeColor : pct >= 35 ? "#ffaa00" : "rgba(255,255,255,0.3)"
                            }}>
                              {pct > 0 ? `${pct}% mastery` : "Not started"}
                            </span>
                            <span className="dtc-action">{done ? "↺ Replay" : "▶ Play"}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Badges */}
          <div className="dash-badges-section">
            <div className="dash-section-label" style={{ marginBottom: "12px" }}>BADGES EARNED ({earnedBadges.length}/{BADGES.length})</div>
            <div className="dash-badges-grid">
              {BADGES.map((badge) => {
                const earned = earnedBadges.includes(badge.id);
                return (
                  <motion.div
                    key={badge.id}
                    className={`dash-badge ${earned ? "dash-badge--earned" : "dash-badge--locked"}`}
                    whileHover={earned ? { scale: 1.04, y: -2 } : {}}
                  >
                    <span className="dash-badge-icon">{earned ? badge.icon : "🔒"}</span>
                    <div className="dash-badge-name">{badge.name}</div>
                    <div className="dash-badge-desc">{badge.desc}</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
