import React, { useState, useEffect } from "react";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gameApi } from "../services/api";
import useProgressStore from "../store/useProgressStore";
import "./os.css";

export default function Dbms() {
  const [openIndex, setOpenIndex]     = useState(null);
  const [masteryData, setMasteryData] = useState({});
  const navigate = useNavigate();

  const completedTopics = useProgressStore((s) => s.completedTopics ?? []);

  useEffect(() => {
    const fetchMastery = async () => {
      try {
        const res = await gameApi.getMasteryChallenges("dbms");
        setMasteryData(res.data.challenges || {});
      } catch (err) {
        console.error("Failed to fetch mastery stats", err);
      }
    };
    fetchMastery();
  }, []);

  const missionsData = [
    {
      id: "fundamentals_1",
      title: "1. DBMS Fundamentals",
      topics: [
        { label: "What is DBMS?",         slug: "what-is-dbms" },
        { label: "Database Architecture", slug: "database-architecture" },
        { label: "Advantages of DBMS",    slug: "advantages-of-dbms" },
        { label: "Types of Databases",    slug: "types-of-databases" },
      ],
    },
    {
      id: "relational_2",
      title: "2. Relational Model & Normalization",
      topics: [
        { label: "Relational Model",        slug: "relational-model" },
        { label: "ER Model",                slug: "er-model" },
        { label: "Functional Dependencies", slug: "functional-dependencies" },
        { label: "1NF / 2NF / 3NF",        slug: "1nf-/-2nf-/-3nf" },
        { label: "BCNF",                    slug: "bcnf" },
      ],
    },
    {
      id: "transactions_3",
      title: "3. Transactions & Concurrency",
      topics: [
        { label: "Transactions",       slug: "transactions" },
        { label: "ACID Properties",    slug: "acid-properties" },
        { label: "Concurrency Problems",slug: "concurrency-problems" },
        { label: "Locks and 2PL",      slug: "locks-and-2pl" },
        { label: "Deadlocks",          slug: "deadlocks" },
      ],
    },
    {
      id: "indexing_4",
      title: "4. Indexing & Trees (Core Visual Module)",
      topics: [
        { label: "Binary Search Tree", slug: "binary-search-tree" },
        { label: "B-Tree",             slug: "b-tree" },
        { label: "B+ Tree",            slug: "b+-tree" },
        { label: "Node Splitting",     slug: "node-splitting" },
        { label: "Traversal Paths",    slug: "traversal-paths" },
      ],
    },
    {
      id: "query_opt_5",
      title: "5. Query Processing & Optimization",
      topics: [
        { label: "SELECT Statement",         slug: "select-statement" },
        { label: "WHERE Filtering",          slug: "where-filtering" },
        { label: "Joins (Inner/Outer)",      slug: "joins-inner-outer" },
        { label: "Index Usage in Queries",   slug: "index-usage-in-queries" },
        { label: "Query Optimization Basics",slug: "query-optimization-basics" },
      ],
    },
  ];

  const handleLaunchMission = (slug) => {
    navigate(`/game/dbms/${slug}`);
  };

  const toggleDropdown = (index) => setOpenIndex(openIndex === index ? null : index);

  return (
    <>
      <Navbar />
      <motion.div className="os-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="dbms-hero">
          <h1>DBMS COMMAND CENTER</h1>
          <p>Master the data layer of the world.</p>
        </div>

        <motion.div className="learning-path">
          <h2>Learning Path</h2>
          <div className="timeline">
            {missionsData.map((mission, index) => {
              const missionDone = masteryData[mission.id] > 0.8;
              return (
                <motion.div key={index} className="timeline-item">
                  <div
                    className="timeline-dot"
                    style={{ borderColor: missionDone ? "#a855f7" : "#444" }}
                  />
                  <div className={`mission-card ${missionDone ? "mission-card--done mission-card--dbms" : ""}`}>
                    <div className="mission-header" onClick={() => toggleDropdown(index)}>
                      <div className="header-info">
                        <span className="mission-title">{mission.title}</span>
                        {missionDone && <span className="certified certified--dbms">COMPLETED</span>}
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
                              <div key={tIdx} className={`topic-row ${done ? "topic-row--done topic-row--dbms" : ""}`}>
                                <div className="topic-name">
                                  <span className={`status-dot ${done ? "status-dot--dbms" : ""}`} />
                                  {topic.label}
                                  {done && <span className="topic-done-badge topic-done-badge--dbms">✓ Done</span>}
                                </div>
                                <button
                                  className={`launch-btn ${done ? "launch-btn--replay launch-btn--replay-dbms" : ""}`}
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
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
