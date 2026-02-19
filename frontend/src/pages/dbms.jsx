import React from "react";
import Navbar from "../components/navbar";
import { motion } from "framer-motion";
import "./Os.css";

export default function Dbms() {
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
            Database <span>Management System</span>
          </h1>
          <p>
            Master core DBMS concepts including relational models,
            normalization, indexing, transactions, concurrency control,
            and query optimization. Build strong fundamentals for system design
            and backend engineering.
          </p>
        </motion.div>

        <motion.div className="os-progress-card" variants={fadeUp}>
          <div className="os-progress-header">
            <h3>Overall Progress</h3>
            <span>0 of 6 Completed</span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: "0%" }}
              transition={{ duration: 1.2 }}
            />
          </div>
        </motion.div>

        <motion.div className="learning-path" variants={fadeUp}>
          <h2>Learning Path</h2>

          <div className="timeline">

            {[
              "1. Introduction to Databases",
              "2. Relational Model & Normalization",
              "3. Transactions & Concurrency Control"
            ].map((title, index) => (
              <motion.div
                key={index}
                className="timeline-item"
                variants={fadeUp}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <div className="timeline-dot"></div>

                <div className="mission-card">
                  <div className="mission-header">
                    <span>{title}</span>
                    <span>⌄</span>
                  </div>
                  <div className="mission-progress">
                    0/2 completed • 0%
                  </div>
                </div>
              </motion.div>
            ))}

          </div>
        </motion.div>

      </motion.div>
    </>
  );
}
