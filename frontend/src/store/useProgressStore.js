/**
 * useProgressStore.js
 * Manages XP, levels, streaks, accuracy, and badges.
 * XP is awarded on goal completion and level completion.
 * Level-up triggers a reward popup and unlocks the next concept.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { gameApi } from "../services/api";

// Level tier definitions — XP thresholds and rewards
export const LEVEL_TIERS = [
  { level: 1, name: "Initiate",        minXP: 0,    color: "#64748b", icon: "🔰",  bonus: 0   },
  { level: 2, name: "Apprentice",      minXP: 200,  color: "#3b82f6", icon: "⚡",  bonus: 50  },
  { level: 3, name: "Engineer",        minXP: 500,  color: "#8b5cf6", icon: "⚙️",  bonus: 100 },
  { level: 4, name: "Architect",       minXP: 1000, color: "#06b6d4", icon: "🏗️",  bonus: 150 },
  { level: 5, name: "Systems Master",  minXP: 2000, color: "#f59e0b", icon: "🧠",  bonus: 250 },
  { level: 6, name: "Interview Ready", minXP: 3500, color: "#ef4444", icon: "🎯",  bonus: 500 },
];

export const DOMAIN_LEVELS = [
  { level: 1, name: "Novice",     threshold: 0.0  },
  { level: 2, name: "Learner",    threshold: 0.35 },
  { level: 3, name: "Proficient", threshold: 0.55 },
  { level: 4, name: "Advanced",   threshold: 0.75 },
  { level: 5, name: "Expert",     threshold: 0.90 },
];

// XP rewards per action type
export const XP_REWARDS = {
  GOAL_COMPLETE:     25,   // single goal inside a challenge
  LEVEL_COMPLETE:   100,   // all goals in a topic done
  FIRST_COMPLETE:   200,   // first-ever topic completed
  CORRECT_ANSWER:    10,   // MCQ correct
  PERFECT_SCORE:     50,   // all goals done without errors
  STREAK_BONUS:      20,   // completing while on streak
  DAILY_FIRST:       15,   // first activity of the day
};

export const BADGES = [
  { id: "first_blood",    name: "First Blood",    icon: "🩸", desc: "Complete your first challenge" },
  { id: "on_fire",        name: "On Fire",         icon: "🔥", desc: "3 correct in a row" },
  { id: "perfectionist",  name: "Perfectionist",   icon: "💎", desc: "Complete a level without any errors" },
  { id: "speed_demon",    name: "Speed Demon",     icon: "⚡", desc: "Complete a challenge in under 60s" },
  { id: "btree_wizard",   name: "B-Tree Wizard",   icon: "🌳", desc: "Trigger 3 node splits" },
  { id: "memory_master",  name: "Memory Master",   icon: "🧩", desc: "Complete 3 memory allocation challenges" },
  { id: "streak_5",       name: "Hot Streak",      icon: "🌟", desc: "5-day streak" },
  { id: "os_level3",      name: "OS Proficient",   icon: "⚙️", desc: "Reach Proficient in OS" },
  { id: "dbms_level3",    name: "DB Architect",    icon: "🗄️", desc: "Reach Proficient in DBMS" },
  { id: "no_hints",       name: "Self-Reliant",    icon: "🎖️", desc: "Complete a level without using hints" },
  { id: "comeback",       name: "Comeback Kid",    icon: "💪", desc: "Complete a level after 5+ failures" },
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
  if (nextIdx >= LEVEL_TIERS.length) return { needed: 0, progress: 100, nextLevel: null };
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
      completedTopics: [],       // slugs of fully completed topics
      accuracyHistory: [],       // [{correct, total}] last 20 challenges
      earnedBadges: [],          // badge ids
      failCountByTopic: {},      // { slug: failCount } for comeback badge
      hintUsedByTopic: {},       // { slug: bool }

      // Domain mastery from backend BKT
      masteryMap: {},            // { slug: p_mastery }
      completedChallenges: [],

      // Pending reward animation (shown by XPHud)
      pendingReward: null,       // { xp, badges, levelUp, message }

      // Computed helpers
      getLevel: () => getLevelForXP(get().totalXP),
      getAccuracy: () => {
        const hist = get().accuracyHistory.slice(-10);
        if (!hist.length) return 0;
        const total = hist.reduce((a, b) => a + b.total, 0);
        const correct = hist.reduce((a, b) => a + b.correct, 0);
        return total ? Math.round((correct / total) * 100) : 0;
      },

      // ── Core XP award (with level-up detection) ────────────────────────
      awardXP: (amount, source = "") => {
        if (amount <= 0) return;
        const prev = get().totalXP;
        const next = prev + amount;
        const prevLevel = getLevelForXP(prev);
        const nextLevel = getLevelForXP(next);
        const leveledUp = nextLevel.level > prevLevel.level;

        // If leveling up, also add the level bonus XP on top
        const bonusXP = leveledUp ? nextLevel.bonus : 0;
        const finalXP = next + bonusXP;

        set({ totalXP: finalXP });

        const reward = {
          xp: amount + bonusXP,
          badges: [],
          levelUp: leveledUp ? nextLevel : null,
          source,
          bonusXP: bonusXP > 0 ? bonusXP : null,
        };
        set({ pendingReward: reward });
      },

      // ── Called when ALL goals in a topic are done ──────────────────────
      awardLevelCompletion: (slug, { hadErrors = false, usedHints = false, timeSeconds = null } = {}) => {
        const { completedTopics, streak, failCountByTopic, hintUsedByTopic } = get();
        const isFirst = completedTopics.length === 0;
        const alreadyDone = completedTopics.includes(slug);

        let xp = alreadyDone ? 30 : XP_REWARDS.LEVEL_COMPLETE; // replay = 30 XP
        if (isFirst) xp += XP_REWARDS.FIRST_COMPLETE;
        if (!hadErrors) xp += XP_REWARDS.PERFECT_SCORE;
        if (streak >= 3) xp += XP_REWARDS.STREAK_BONUS;

        const prev = get().totalXP;
        const next = prev + xp;
        const prevLevel = getLevelForXP(prev);
        const nextLevel = getLevelForXP(next);
        const leveledUp = nextLevel.level > prevLevel.level;
        const bonusXP = leveledUp ? nextLevel.bonus : 0;
        const finalXP = next + bonusXP;

        set({
          totalXP: finalXP,
          completedTopics: alreadyDone ? completedTopics : [...completedTopics, slug],
          hintUsedByTopic: { ...hintUsedByTopic, [slug]: usedHints },
        });

        // Check badges
        const newBadges = get()._checkBadges({ slug, hadErrors, usedHints, timeSeconds });

        set({
          pendingReward: {
            xp: xp + bonusXP,
            badges: newBadges,
            levelUp: leveledUp ? nextLevel : null,
            source: "level_complete",
            bonusXP: bonusXP > 0 ? bonusXP : null,
            message: isFirst ? "🎉 First level complete!" : !hadErrors ? "⭐ Perfect run!" : null,
          },
        });

        // Sync with backend
        get()._updateStreak();
        get().syncFromBackend().catch(() => {});
      },

      // ── Sync from backend (BKT mastery + server XP) ───────────────────
      syncFromBackend: async () => {
        try {
          const res = await gameApi.getUserProgress();
          const data = res.data;
          const serverXP = data.totalExp || 0;
          const localXP  = get().totalXP;

          // Only update if server has MORE (avoids overwriting optimistic local state)
          if (serverXP > localXP) {
            const prevLevel = getLevelForXP(localXP);
            const nextLevel = getLevelForXP(serverXP);
            const gained = serverXP - localXP;
            set({ totalXP: serverXP });
            if (nextLevel.level > prevLevel.level) {
              set({ pendingReward: { xp: gained, levelUp: nextLevel, badges: [], source: "sync" } });
            }
          }

          set({
            masteryMap: data.masteryMap || {},
            completedChallenges: data.completedChallenges || [],
          });
        } catch (e) {
          console.warn("Progress sync failed:", e);
        }
      },

      recordChallengeResult: (correct, total) => {
        const hist = [...get().accuracyHistory, { correct, total }].slice(-20);
        set({ accuracyHistory: hist });
      },

      recordFailure: (slug) => {
        const counts = get().failCountByTopic;
        set({ failCountByTopic: { ...counts, [slug]: (counts[slug] || 0) + 1 } });
      },

      markTopicComplete: (slug) =>
        set((state) => ({
          completedTopics: state.completedTopics.includes(slug)
            ? state.completedTopics
            : [...state.completedTopics, slug],
        })),

      clearPendingReward: () => set({ pendingReward: null }),

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

      _checkBadges: ({ slug = "", hadErrors = true, usedHints = false, timeSeconds = null } = {}) => {
        const { earnedBadges, completedTopics, completedChallenges, streak, masteryMap, failCountByTopic } = get();
        const newBadges = [];

        const award = (id) => {
          if (!earnedBadges.includes(id) && !newBadges.includes(id)) newBadges.push(id);
        };

        if (completedTopics.length === 0 || (completedTopics.length === 1 && completedTopics[0] === slug)) {
          award("first_blood");
        }
        if (streak >= 5)          award("streak_5");
        if (!hadErrors)           award("perfectionist");
        if (!usedHints)           award("no_hints");
        if (timeSeconds && timeSeconds < 60) award("speed_demon");
        if ((failCountByTopic[slug] || 0) >= 5 && !hadErrors) award("comeback");

        const memTopics = completedTopics.filter(s => s.includes("memory") || s.includes("alloc") || s.includes("pag"));
        if (memTopics.length >= 3) award("memory_master");

        const osAvg = Object.entries(masteryMap)
          .filter(([k]) => k.startsWith("os_")).map(([, v]) => v);
        if (osAvg.length && osAvg.reduce((a,b)=>a+b,0)/osAvg.length >= 0.55) award("os_level3");

        const dbAvg = Object.entries(masteryMap)
          .filter(([k]) => k.startsWith("dbms_")).map(([, v]) => v);
        if (dbAvg.length && dbAvg.reduce((a,b)=>a+b,0)/dbAvg.length >= 0.55) award("dbms_level3");

        if (newBadges.length) {
          set({ earnedBadges: [...earnedBadges, ...newBadges] });
        }
        return newBadges;
      },
    }),
    {
      name: "cme-progress-v3",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useProgressStore;
