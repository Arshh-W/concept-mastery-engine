import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import './Goalpanel.css';

const GoalPanel = () => {
  const { goals } = useGameStore();

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
              className={`goal-item ${goal.completed ? 'completed' : ''}`}
            >
              <div className="status-indicator">
                {goal.completed ? '✓' : '○'}
              </div>
              <div className="goal-text">
                <p>{goal.text}</p>
                <span className="reward">+{goal.xp} XP</span>
              </div>
              {goal.completed && (
                <motion.div 
                  className="strike-through"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
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