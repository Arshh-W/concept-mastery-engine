/**
 * XPHud.jsx
 * Persistent floating HUD showing player level, XP bar, streak, accuracy.
 * Sits in the top-right corner during gameplay.
 */
import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useProgressStore, {
  getLevelForXP,
  getXPToNextLevel,
  BADGES,
} from "../store/useProgressStore";
import "./XPHud.css";

export default function XPHud() {
  const { totalXP, streak, earnedBadges, pendingReward, clearPendingReward, getAccuracy } =
    useProgressStore();

  const level = getLevelForXP(totalXP);
  const { progress, needed, nextLevel } = getXPToNextLevel(totalXP);
  const accuracy = getAccuracy();

  // Auto-clear reward after animation
  useEffect(() => {
    if (pendingReward) {
      const t = setTimeout(clearPendingReward, 4000);
      return () => clearTimeout(t);
    }
  }, [pendingReward, clearPendingReward]);

  return (
    <>
      {/* Main HUD */}
      <div className="xp-hud">
        {/* Level Badge */}
        <div className="xp-level-badge" style={{ "--level-color": level.color }}>
          <span className="xp-level-icon">{level.icon}</span>
          <div className="xp-level-info">
            <div className="xp-level-name">{level.name}</div>
            <div className="xp-level-num">Lv.{level.level}</div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="xp-bar-container">
          <div className="xp-bar-label">
            <span>{totalXP.toLocaleString()} XP</span>
            {nextLevel && <span className="xp-needed">+{needed} to {nextLevel.name}</span>}
          </div>
          <div className="xp-bar-track">
            <motion.div
              className="xp-bar-fill"
              style={{ "--level-color": level.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="xp-stats-row">
          <div className="xp-stat">
            <span className="xp-stat-icon">🔥</span>
            <span className="xp-stat-val">{streak}d</span>
          </div>
          <div className="xp-stat">
            <span className="xp-stat-icon">🎯</span>
            <span className="xp-stat-val">{accuracy}%</span>
          </div>
          <div className="xp-stat">
            <span className="xp-stat-icon">🏅</span>
            <span className="xp-stat-val">{earnedBadges.length}</span>
          </div>
        </div>
      </div>

      {/* Reward Popup */}
      <AnimatePresence>
        {pendingReward && (
          <RewardPopup reward={pendingReward} />
        )}
      </AnimatePresence>
    </>
  );
}

function RewardPopup({ reward }) {
  const badgeDetails = reward.badges?.map(id => BADGES.find(b => b.id === id)).filter(Boolean);

  return (
    <motion.div
      className="reward-popup"
      initial={{ opacity: 0, y: 60, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -40, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {reward.levelUp && (
        <motion.div
          className="reward-levelup"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: [0.7, 1.1, 1], opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="reward-levelup-icon" style={{ filter: `drop-shadow(0 0 16px ${reward.levelUp.color})` }}>
            {reward.levelUp.icon}
          </div>
          <div>
            <div className="reward-levelup-title" style={{ color: reward.levelUp.color }}>
              ⬆ LEVEL UP!
            </div>
            <div className="reward-levelup-name">{reward.levelUp.name}</div>
            {reward.bonusXP && (
              <div className="reward-levelup-bonus">+{reward.bonusXP} level bonus XP</div>
            )}
          </div>
        </motion.div>
      )}

      {reward.message && (
        <div className="reward-message">{reward.message}</div>
      )}

      {reward.xp > 0 && (
        <motion.div
          className="reward-xp"
          initial={{ scale: 0.5 }}
          animate={{ scale: [0.5, 1.2, 1] }}
          transition={{ duration: 0.4 }}
        >
          +{reward.xp} XP
        </motion.div>
      )}

      {reward.source === "level_complete" && !reward.levelUp && (
        <div className="reward-source">Level Complete 🎯</div>
      )}

      {badgeDetails?.map(badge => (
        <motion.div
          key={badge.id}
          className="reward-badge"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="reward-badge-icon">{badge.icon}</span>
          <div>
            <div className="reward-badge-name">{badge.name}</div>
            <div className="reward-badge-desc">{badge.desc}</div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
