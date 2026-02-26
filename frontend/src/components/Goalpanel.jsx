import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "react-router-dom";
import useGameStore from "../store/useGameStore";
import useGameStore1 from "../store/use1";
import "./Goalpanel.css";

const GoalPanel = () => {
  const { domain } = useParams();

  const dbmsStore = useGameStore();
  const osStore = useGameStore1();

  const goals =
    domain === "os"
      ? osStore.goals || []
      : dbmsStore.goals || [];

  return (
    <div className="goal-panel">
      <div className="panel-header">
        <span className="icon">🎯</span>
        <h3>Mission Objectives</h3>
      </div>

      <div className="goals-list">
        <AnimatePresence>
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className={`goal-item ${goal.completed ? "completed" : ""}`}
            >
              <div className="status-indicator">
                {goal.completed ? "✓" : "○"}
              </div>

              <div className="goal-text">
                <p>{goal.text}</p>
                <span className="reward">+{goal.xp} XP</span>
              </div>

              {goal.completed && (
                <motion.div
                  className="strike-through"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GoalPanel;