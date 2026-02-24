import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import './Eventlog.css';

const EventLog = () => {
  // Defensive destructuring: default to an empty array to prevent .map() errors
  const { currentEventLog = [] } = useGameStore();
  const logEndRef = useRef(null);

  // Auto-scroll to the latest system event whenever the log updates
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentEventLog]);

  return (
    <div className="event-log-container">
      <div className="log-header">
        <div className="header-left">
          <span className="pulse-dot"></span>
          <h3>System Activity Log</h3>
        </div>
        <span className="log-count">{currentEventLog.length} Events</span>
      </div>

      <div className="log-content">
        <div className="log-scroll-area">
          <AnimatePresence initial={false}>
            {currentEventLog.length > 0 ? (
              currentEventLog.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20, backgroundColor: "rgba(255, 132, 0, 0.1)" }}
                  animate={{ opacity: 1, x: 0, backgroundColor: "transparent" }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  className={`log-entry ${event.type || 'info'}`}
                >
                  <span className="timestamp">
                    [{new Date(event.id).toLocaleTimeString([], { 
                      hour12: false, 
                      minute: '2-digit', 
                      second: '2-digit' 
                    })}]
                  </span>
                  <span className="message-type-tag">[{event.type?.toUpperCase()}]</span>
                  <span className="message">{event.message}</span>
                </motion.div>
              ))
            ) : (
              <div className="empty-log-state">
                <p>Awaiting system signals...</p>
              </div>
            )}
          </AnimatePresence>
          {/* Invisible element to anchor the scroll-to-bottom logic */}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};

export default EventLog;