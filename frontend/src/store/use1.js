import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { gameApi } from "../services/api";
import { getTopicConfig } from "../config/topicConfig";

const useGameStore1 = create(
  persist(
    (set, get) => ({
      xp: 0,
      freed: 0,
      lastError: null,
      goals: [],
      memory: { total: 1024, heapUsed: 0, blocks: [] },
      currentEventLog: [],
      commandHistory: [],

      logEvent: (message, type = "info") =>
        set((state) => ({
          currentEventLog: [
            { message, type, id: Date.now(), time: new Date().toLocaleTimeString() },
            ...state.currentEventLog,
          ].slice(0, 20),
        })),

      addCommand: (cmd, output) =>
        set((state) => ({
          commandHistory: [...state.commandHistory, { cmd, output }],
        })),

      clearHistory: () => set({ commandHistory: [] }),

      resetSession: (slug) => {
        const config = getTopicConfig(slug);
        const freshGoals = config.goals.map(g => ({ ...g, completed: false }));
        set({
          goals: freshGoals,
          memory: { total: 1024, heapUsed: 0, blocks: [] },
          currentEventLog: [],
          commandHistory: [],
          freed: 0,
          lastError: null,
          xp: 0,
        });
      },

      evaluateGoals: () => {
        const { goals, memory, freed, lastError } = get();
        const snap = { memory, freed, lastError };
        goals.forEach(goal => {
          if (!goal.completed && typeof goal.check === "function" && goal.check(snap)) {
            get().completeGoal(goal.id);
          }
        });
      },

      completeGoal: (goalId) => {
        const { goals, xp } = get();
        const goal = goals.find(g => g.id === goalId);
        if (goal && !goal.completed) {
          set({
            xp: xp + goal.xp,
            goals: goals.map(g => g.id === goalId ? { ...g, completed: true } : g),
          });
          get().logEvent(`✓ GOAL: ${goal.text}`, "success");
        }
      },

      allocateMemory: async (sizeArg, nameArg) => {
        const size = Number(sizeArg);
        const name = nameArg || `Block_${Math.floor(Math.random() * 999)}`;

        if (isNaN(size) || size <= 0) {
          get().logEvent("Invalid size — usage: ALLOC [size] [name]", "error");
          return { success: false, error: "Invalid allocation size" };
        }

        const { memory } = get();
        if (memory.heapUsed + size > memory.total) {
          set({ lastError: "out of memory" });
          get().logEvent(`OUT OF MEMORY: ${size} MB requested, ${memory.total - memory.heapUsed} MB free`, "error");
          return { success: false, error: "Out of memory" };
        }

        const newBlock = { id: `block-${Date.now()}`, name, size };
        set(state => ({
          memory: {
            ...state.memory,
            heapUsed: state.memory.heapUsed + size,
            blocks: [...state.memory.blocks, newBlock],
          },
          lastError: null,
        }));
        get().logEvent(`Allocated ${size} MB → ${name}`, "success");

        try { await gameApi.submitAction("ALLOCATE", { name, size }); } catch {}
        get().evaluateGoals();
        return { success: true };
      },

      freeMemory: async (identifier) => {
        const { memory } = get();
        const id_lower = identifier?.toLowerCase();
        const block = memory.blocks.find(
          b => b.name?.toLowerCase() === id_lower || b.id?.toLowerCase() === id_lower
        );
        if (!block) {
          get().logEvent(`Block "${identifier}" not found`, "error");
          return { success: false, error: "Block not found" };
        }
        set(state => ({
          memory: {
            ...state.memory,
            heapUsed: state.memory.heapUsed - block.size,
            blocks: state.memory.blocks.filter(b => b.id !== block.id),
          },
          freed: state.freed + 1,
        }));
        get().logEvent(`Freed ${block.size} MB from ${block.name}`, "info");
        try { await gameApi.submitAction("FREE", { id: block.id, name: block.name }); } catch {}
        get().evaluateGoals();
        return { success: true };
      },
    }),
    { name: "codeconquer-os-session", storage: createJSONStorage(() => localStorage) }
  )
);

export default useGameStore1;
