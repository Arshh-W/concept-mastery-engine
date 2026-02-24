import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import './Eventlog.css';

const EventLog = () => {
  const { currentEventLog } = useGameStore();
  const logEndRef = useRef(null);

  // Auto-scroll to the latest system event
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentEventLog]);

  return (
    <div className="event-log-container">
      <div className="log-header">
        <span className="pulse-dot"></span>
        <h3>System Activity Log</h3>
      </div>

      <div className="log-content">
        <AnimatePresence>
          {currentEventLog.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`log-entry ${event.type}`}
            >
              <span className="timestamp">
                [{new Date(event.id).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}]
              </span>
              <span className="message">{event.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default EventLog;