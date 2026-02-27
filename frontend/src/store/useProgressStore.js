/**
 * useProgressStore.js
 * Manages XP, levels, streaks, accuracy, and badges
 * Wires into the existing BKT mastery data from the backend
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { gameApi } from "../services/api";

// Level tier definitions
export const LEVEL_TIERS = [
  { level: 1, name: "Initiate",        minXP: 0,    color: "#64748b", icon: "🔰" },
  { level: 2, name: "Apprentice",      minXP: 200,  color: "#3b82f6", icon: "⚡" },
  { level: 3, name: "Engineer",        minXP: 500,  color: "#8b5cf6", icon: "⚙️" },
  { level: 4, name: "Architect",       minXP: 1000, color: "#06b6d4", icon: "🏗️" },
  { level: 5, name: "Systems Master",  minXP: 2000, color: "#f59e0b", icon: "🧠" },
  { level: 6, name: "Interview Ready", minXP: 3500, color: "#ef4444", icon: "🎯" },
];

export const DOMAIN_LEVELS = [
  { level: 1, name: "Novice",    threshold: 0.0  },
  { level: 2, name: "Learner",   threshold: 0.35 },
  { level: 3, name: "Proficient",threshold: 0.55 },
  { level: 4, name: "Advanced",  threshold: 0.75 },
  { level: 5, name: "Expert",    threshold: 0.90 },
];

export const BADGES = [
  { id: "first_blood",   name: "First Blood",    icon: "🩸", desc: "Complete your first challenge" },
  { id: "on_fire",       name: "On Fire",         icon: "🔥", desc: "3 correct in a row" },
  { id: "perfectionist", name: "Perfectionist",   icon: "💎", desc: "Score 100% on a challenge" },
  { id: "speed_demon",   name: "Speed Demon",     icon: "⚡", desc: "Complete a challenge in under 60s" },
  { id: "btree_wizard",  name: "B-Tree Wizard",   icon: "🌳", desc: "Trigger 3 node splits" },
  { id: "memory_master", name: "Memory Master",   icon: "🧩", desc: "Master the paging module" },
  { id: "streak_5",      name: "Hot Streak",      icon: "🌟", desc: "5-day streak" },
  { id: "os_level3",     name: "OS Level 3",      icon: "⚙️", desc: "Reach Proficient in OS" },
  { id: "dbms_level3",   name: "DB Architect",    icon: "🗄️", desc: "Reach Proficient in DBMS" },
];

export const getLevelForXP = (xp) => {
  let tier = LEVEL_TIERS[0];
  for (const t of LEVEL_TIERS) {
    if (xp >= t.minXP) tier = t;
  }
  return tier;
};

export const getXPToNextLevel = (xp) => {
  const current = getLevelForXP(xp);
  const nextIdx = LEVEL_TIERS.findIndex(t => t.level === current.level) + 1;
  if (nextIdx >= LEVEL_TIERS.length) return { needed: 0, progress: 100 };
  const next = LEVEL_TIERS[nextIdx];
  const range = next.minXP - current.minXP;
  const gained = xp - current.minXP;
  return {
    needed: next.minXP - xp,
    progress: Math.min(100, Math.round((gained / range) * 100)),
    nextLevel: next,
  };
};

export const getDomainLevel = (masteryP) => {
  let dl = DOMAIN_LEVELS[0];
  for (const d of DOMAIN_LEVELS) {
    if (masteryP >= d.threshold) dl = d;
  }
  return dl;
};

const useProgressStore = create(
  persist(
    (set, get) => ({
      // Core stats
      totalXP: 0,
      streak: 0,
      lastActivityDate: null,
      completedTopics: [],   // array of slug strings e.g. ["memory-management", "b-tree"]
      accuracyHistory: [],       // last 20 challenge results [{correct, total}]
      earnedBadges: [],          // badge ids
      
      // Domain mastery from backend (BKT p_mastery values 0..1)
      masteryMap: {},            // { slug: p_mastery }
      completedChallenges: [],
      
      // Pending reward animation
      pendingReward: null,       // { xp, badge?, levelUp? }

      // Computed helpers
      getLevel: () => getLevelForXP(get().totalXP),
      getAccuracy: () => {
        const hist = get().accuracyHistory.slice(-10);
        if (!hist.length) return 0;
        const total = hist.reduce((a, b) => a + b.total, 0);
        const correct = hist.reduce((a, b) => a + b.correct, 0);
        return total ? Math.round((correct / total) * 100) : 0;
      },

      // Sync with backend after session end
      syncFromBackend: async () => {
        try {
          const res = await gameApi.getUserProgress();
          const data = res.data;
          const prevXP = get().totalXP;
          const newXP = data.totalExp || 0;
          const xpGained = Math.max(0, newXP - prevXP);

          set({
            totalXP: newXP,
            masteryMap: data.masteryMap || {},
            completedChallenges: data.completedChallenges || [],
          });

          // Update streak
          get()._updateStreak();

          // Check for new badges
          const newBadges = get()._checkBadges();

          if (xpGained > 0 || newBadges.length > 0) {
            const prevLevel = getLevelForXP(prevXP);
            const newLevel = getLevelForXP(newXP);
            set({
              pendingReward: {
                xp: xpGained,
                badges: newBadges,
                levelUp: newLevel.level > prevLevel.level ? newLevel : null,
              }
            });
          }
        } catch (e) {
          console.warn("Progress sync failed:", e);
        }
      },

      // Award XP locally (optimistic, reconciled on sync)
      awardXP: (amount, source = "") => {
        const prev = get().totalXP;
        const next = prev + amount;
        const prevLevel = getLevelForXP(prev);
        const nextLevel = getLevelForXP(next);
        set({ totalXP: next });
        if (nextLevel.level > prevLevel.level) {
          set({ pendingReward: { xp: amount, levelUp: nextLevel, badges: [], source } });
        }
      },

      recordChallengeResult: (correct, total) => {
        const hist = [...get().accuracyHistory, { correct, total }].slice(-20);
        set({ accuracyHistory: hist });
      },

      clearPendingReward: () => set({ pendingReward: null }),

      markTopicComplete: (slug) =>
        set((state) => ({
          completedTopics: state.completedTopics.includes(slug)
            ? state.completedTopics
            : [...state.completedTopics, slug],
        })),

      _updateStreak: () => {
        const today = new Date().toDateString();
        const last = get().lastActivityDate;
        if (last === today) return;
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        set({
          streak: last === yesterday ? get().streak + 1 : 1,
          lastActivityDate: today,
        });
      },

      _checkBadges: () => {
        const { earnedBadges, completedChallenges, streak, masteryMap } = get();
        const newBadges = [];

        const award = (id) => {
          if (!earnedBadges.includes(id)) {
            newBadges.push(id);
          }
        };

        if (completedChallenges.length >= 1) award("first_blood");
        if (streak >= 5) award("streak_5");

        const osAvg = Object.entries(masteryMap)
          .filter(([k]) => k.startsWith("os_"))
          .map(([, v]) => v);
        if (osAvg.length && osAvg.reduce((a,b)=>a+b,0)/osAvg.length >= 0.55) award("os_level3");

        const dbAvg = Object.entries(masteryMap)
          .filter(([k]) => k.startsWith("dbms_"))
          .map(([, v]) => v);
        if (dbAvg.length && dbAvg.reduce((a,b)=>a+b,0)/dbAvg.length >= 0.55) award("dbms_level3");

        if (newBadges.length) {
          set({ earnedBadges: [...earnedBadges, ...newBadges] });
        }
        return newBadges;
      },
    }),
    {
      name: "cme-progress-v2",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useProgressStore;
