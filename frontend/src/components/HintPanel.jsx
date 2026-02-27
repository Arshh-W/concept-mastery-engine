/**
 * HintPanel.jsx
 * Progressive 3-tier hint system.
 * Sits in the game shell, fetches hints from /game/adaptive/hint.
 * Shows hints progressively — each request escalates level.
 */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../services/api";
import "./HintPanel.css";

const HINT_LEVEL_LABELS = ["", "Gentle Nudge", "Concept Reminder", "Full Solution"];
const HINT_LEVEL_COLORS = ["", "#f59e0b", "#06b6d4", "#8b5cf6"];

export default function HintPanel({ sessionToken, challengeSlug }) {
  const [hints, setHints] = useState([]);       // array of revealed hints
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [open, setOpen] = useState(false);

  const currentLevel = hints.length;

  const fetchNextHint = async () => {
    if (exhausted || loading) return;
    setLoading(true);
    try {
      const res = await apiClient.get("/game/adaptive/hint", {
        params: {
          session_token: sessionToken,
          challenge_slug: challengeSlug,
          hint_level: currentLevel,
        },
      });

      const data = res.data;
      if (!data.hint) {
        // Backend says no hint due yet — show a waiting message
        setHints(prev => [
          ...prev,
          {
            level: currentLevel + 1,
            message: data.message || "Keep trying a bit longer before the next hint unlocks.",
            concept_reference: null,
            not_ready: true,
          },
        ]);
        return;
      }

      setHints(prev => [...prev, data.hint]);

      if (data.hint.level >= 3) {
        setExhausted(true);
      }
    } catch (e) {
      // Offline fallback
      setHints(prev => [
        ...prev,
        {
          level: currentLevel + 1,
          message: "Check the goal panel carefully — the condition you need to satisfy is described there.",
          concept_reference: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hint-panel">
      {/* Toggle button */}
      <button
        className={`hint-toggle ${open ? "open" : ""}`}
        onClick={() => setOpen(o => !o)}
        title="Hint System"
      >
        💡
        <span className="hint-toggle-label">Hints</span>
        {hints.length > 0 && (
          <span className="hint-badge">{hints.length}</span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="hint-dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
          >
            <div className="hint-panel-header">
              <span className="hint-panel-title">💡 Hint System</span>
              <span className="hint-level-indicator">
                Level {currentLevel} / 3
              </span>
            </div>

            {/* Revealed hints */}
            <div className="hints-list">
              {hints.length === 0 && (
                <div className="hints-empty">
                  No hints revealed yet. Click below to unlock your first hint.
                </div>
              )}
              {hints.map((hint, i) => (
                <motion.div
                  key={i}
                  className={`hint-item ${hint.not_ready ? "not-ready" : ""}`}
                  style={{ "--hc": HINT_LEVEL_COLORS[hint.level] || "#f59e0b" }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                >
                  <div className="hint-item-header">
                    <span
                      className="hint-item-label"
                      style={{ color: HINT_LEVEL_COLORS[hint.level] || "#f59e0b" }}
                    >
                      {HINT_LEVEL_LABELS[hint.level] || `Hint ${hint.level}`}
                    </span>
                  </div>
                  <p className="hint-item-text">{hint.message}</p>
                  {hint.concept_reference && (
                    <div className="hint-concept-ref">
                      📚 {hint.concept_reference}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Unlock next hint button */}
            {!exhausted && (
              <button
                className="hint-unlock-btn"
                onClick={fetchNextHint}
                disabled={loading}
              >
                {loading ? (
                  <span className="hint-spinner">⟳</span>
                ) : currentLevel === 0 ? (
                  "🔓 Unlock First Hint"
                ) : currentLevel < 3 ? (
                  `🔓 Unlock Hint ${currentLevel + 1}`
                ) : (
                  "All Hints Revealed"
                )}
              </button>
            )}

            {exhausted && (
              <div className="hint-exhausted">
                All hints revealed. Study the solution above and try again!
              </div>
            )}

            {/* XP cost warning */}
            {currentLevel === 0 && (
              <div className="hint-cost-note">
                Using hints doesn't cost XP, but challenges completed without hints give a bonus.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
