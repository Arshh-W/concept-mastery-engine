/**
 * Dashboard.jsx
 * Shows the player's mastery across all OS and DBMS topics,
 * XP level, streak, badges, and completed topics.
 */
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import useProgressStore, {
  getLevelForXP,
  getXPToNextLevel,
  getDomainLevel,
  LEVEL_TIERS,
  BADGES,
} from "../store/useProgressStore";
import { gameApi } from "../services/api";
import "./Dashboard.css";

// All topics indexed by slug → display label + domain
const ALL_TOPICS = {
  // OS
  "what-is-an-operating-system": { label: "What is an OS?",          domain: "os" },
  "kernel-vs-user-mode":         { label: "Kernel vs User Mode",      domain: "os" },
  "process-vs-program":          { label: "Process vs Program",       domain: "os" },
  "process-states":              { label: "Process States",           domain: "os" },
  "context-switching":           { label: "Context Switching",        domain: "os" },
  "contiguous-allocation":       { label: "Contiguous Allocation",    domain: "os" },
  "paging":                      { label: "Paging",                   domain: "os" },
  "segmentation":                { label: "Segmentation",             domain: "os" },
  "virtual-memory":              { label: "Virtual Memory",           domain: "os" },
  "page-replacement---lru":      { label: "Page Replacement LRU",     domain: "os" },
  "critical-section":            { label: "Critical Section",         domain: "os" },
  "mutex":                       { label: "Mutex",                    domain: "os" },
  "semaphores":                  { label: "Semaphores",               domain: "os" },
  "deadlock":                    { label: "Deadlock",                 domain: "os" },
  // DBMS
  "what-is-dbms":                { label: "What is DBMS?",            domain: "dbms" },
  "relational-model":            { label: "Relational Model",         domain: "dbms" },
  "transactions":                { label: "Transactions",             domain: "dbms" },
  "acid-properties":             { label: "ACID Properties",          domain: "dbms" },
  "b-tree":                      { label: "B-Tree",                   domain: "dbms" },
  "b+-tree":                     { label: "B+ Tree",                  domain: "dbms" },
  "node-splitting":              { label: "Node Splitting",           domain: "dbms" },
  "traversal-paths":             { label: "Traversal Paths",          domain: "dbms" },
  "select-statement":            { label: "SELECT Statement",         domain: "dbms" },
  "index-usage-in-queries":      { label: "Index Usage in Queries",   domain: "dbms" },
};

const OS_COLOR   = "#00e5ff";
const DBMS_COLOR = "#a855f7";

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    totalXP, streak, earnedBadges, masteryMap,
    completedTopics, syncFromBackend,
  } = useProgressStore();

  const [backendProgress, setBackendProgress] = useState(null);

  const level              = getLevelForXP(totalXP);
  const { progress: xpPct, needed, nextLevel } = getXPToNextLevel(totalXP);

  useEffect(() => {
    syncFromBackend();
    gameApi.getUserProgress()
      .then((r) => setBackendProgress(r.data))
      .catch(() => {});
  }, []);

  // Split topics by domain
  const osTopics   = Object.entries(ALL_TOPICS).filter(([, v]) => v.domain === "os");
  const dbmsTopics = Object.entries(ALL_TOPICS).filter(([, v]) => v.domain === "dbms");

  const osMastery   = Object.entries(masteryMap).filter(([k]) => k.startsWith("os_")).map(([, v]) => v);
  const dbmsMastery = Object.entries(masteryMap).filter(([k]) => k.startsWith("dbms_")).map(([, v]) => v);
  const osAvg       = osMastery.length   ? Math.round(osMastery.reduce((a,b) => a+b,0)   / osMastery.length   * 100) : 0;
  const dbmsAvg     = dbmsMastery.length ? Math.round(dbmsMastery.reduce((a,b) => a+b,0) / dbmsMastery.length * 100) : 0;

  const osDomLevel   = getDomainLevel(osAvg / 100);
  const dbmsDomLevel = getDomainLevel(dbmsAvg / 100);

  const completedCount = completedTopics.length;
  const totalTopics    = Object.keys(ALL_TOPICS).length;

  return (
    <div className="dash-page">
      <Navbar />

      <div className="dash-layout">

        {/* ── Left: Player card ── */}
        <aside className="dash-sidebar">
          <motion.div
            className="dash-player-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ "--lc": level.color }}
          >
            <div className="dash-avatar">{level.icon}</div>
            <div className="dash-level-name" style={{ color: level.color }}>{level.name}</div>
            <div className="dash-xp">{totalXP.toLocaleString()} XP</div>
            <div className="dash-xp-track">
              <motion.div
                className="dash-xp-fill"
                style={{ background: level.color }}
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
            {nextLevel && (
              <div className="dash-xp-next">+{needed} XP to {nextLevel.name}</div>
            )}
          </motion.div>

          {/* Streak + completions */}
          <div className="dash-stats-row">
            <div className="dash-stat-pill">
              <span className="dsp-icon">🔥</span>
              <span className="dsp-val">{streak}</span>
              <span className="dsp-label">Day Streak</span>
            </div>
            <div className="dash-stat-pill">
              <span className="dsp-icon">✅</span>
              <span className="dsp-val">{completedCount}</span>
              <span className="dsp-label">Topics Done</span>
            </div>
          </div>

          {/* Level tier ladder */}
          <div className="dash-tier-ladder">
            <div className="dash-section-label">LEVEL TIERS</div>
            {LEVEL_TIERS.map((tier) => {
              const active = level.level === tier.level;
              const unlocked = totalXP >= tier.minXP;
              return (
                <div key={tier.level} className={`dash-tier ${active ? "dash-tier--active" : ""} ${!unlocked ? "dash-tier--locked" : ""}`}
                  style={{ "--tc": tier.color }}>
                  <span className="dash-tier-icon">{tier.icon}</span>
                  <div className="dash-tier-info">
                    <div className="dash-tier-name">{tier.name}</div>
                    <div className="dash-tier-xp">{tier.minXP.toLocaleString()} XP</div>
                  </div>
                  {active && <span className="dash-tier-current">← YOU</span>}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="dash-main">
          <div className="dash-top-header">
            <h1 className="dash-title">Mastery Dashboard</h1>
            <p className="dash-subtitle">Track your progress across all topics</p>
          </div>

          {/* Domain summary cards */}
          <div className="dash-domain-cards">
            <motion.div className="dash-domain-card" style={{ "--dc": OS_COLOR }}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="ddc-icon">⚙️</div>
              <div className="ddc-info">
                <div className="ddc-title">Operating Systems</div>
                <div className="ddc-level" style={{ color: OS_COLOR }}>{osDomLevel.name}</div>
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
              </div>
            </motion.div>

            <motion.div className="dash-domain-card" style={{ "--dc": DBMS_COLOR }}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="ddc-icon">🗄️</div>
              <div className="ddc-info">
                <div className="ddc-title">Database Systems</div>
                <div className="ddc-level" style={{ color: DBMS_COLOR }}>{dbmsDomLevel.name}</div>
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
              </div>
            </motion.div>
          </div>

          {/* Topic mastery grids */}
          <div className="dash-topics-section">

            <TopicGrid
              title="⚙️ Operating Systems"
              topics={osTopics}
              completedTopics={completedTopics}
              masteryMap={masteryMap}
              color={OS_COLOR}
              onLaunch={(slug) => navigate(`/game/os/${slug}`)}
            />

            <TopicGrid
              title="🗄️ Database Systems"
              topics={dbmsTopics}
              completedTopics={completedTopics}
              masteryMap={masteryMap}
              color={DBMS_COLOR}
              onLaunch={(slug) => navigate(`/game/dbms/${slug}`)}
            />
          </div>

          {/* Badges */}
          <div className="dash-badges-section">
            <div className="dash-section-label">BADGES EARNED</div>
            <div className="dash-badges-grid">
              {BADGES.map((badge) => {
                const earned = earnedBadges.includes(badge.id);
                return (
                  <div key={badge.id} className={`dash-badge ${earned ? "dash-badge--earned" : "dash-badge--locked"}`}>
                    <span className="dash-badge-icon">{earned ? badge.icon : "🔒"}</span>
                    <div className="dash-badge-name">{badge.name}</div>
                    <div className="dash-badge-desc">{badge.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function TopicGrid({ title, topics, completedTopics, masteryMap, color, onLaunch }) {
  return (
    <div className="dash-topic-grid-section">
      <div className="dash-topic-grid-title" style={{ color }}>{title}</div>
      <div className="dash-topic-grid">
        {topics.map(([slug, info], i) => {
          const done    = completedTopics.includes(slug);
          const mastery = masteryMap[slug] ?? 0;
          const pct     = Math.round(mastery * 100);
          return (
            <motion.div
              key={slug}
              className={`dash-topic-card ${done ? "dash-topic-card--done" : ""}`}
              style={{ "--tc": color }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => onLaunch(slug)}
            >
              <div className="dtc-header">
                <span className="dtc-label">{info.label}</span>
                {done && <span className="dtc-done-badge">✓</span>}
              </div>
              <div className="dtc-bar-track">
                <motion.div
                  className="dtc-bar-fill"
                  style={{ background: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.04 }}
                />
              </div>
              <div className="dtc-footer">
                <span className="dtc-pct" style={{ color }}>{pct}% mastery</span>
                <span className="dtc-action">{done ? "↺ Replay" : "▶ Play"}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
