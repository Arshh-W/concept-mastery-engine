import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import useGameStore from '../store/useGameStore';
import useGameStore1 from '../store/use1';
import './Eventlog.css';

const EventLog = () => {
  const { domain } = useParams();

  // Read from the correct store depending on active domain
  const dbmsLog = useGameStore((s) => s.currentEventLog ?? []);
  const osLog   = useGameStore1((s) => s.currentEventLog ?? []);
  const currentEventLog = domain === 'os' ? osLog : dbmsLog;

  const logEndRef = useRef(null);

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
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};

export default EventLog;
