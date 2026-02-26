import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { gameApi } from "../services/api";

const useGameStore1 = create(
  persist(
    (set, get) => ({
      xp: 0,

      goals: [
        {
          id: 1,
          text: "Allocate a memory block over 100MB",
          completed: false,
          xp: 40,
        },
        {
          id: 2,
          text: "Allocate 3 different memory blocks",
          completed: false,
          xp: 50,
        },
        {
          id: 3,
          text: "Free a memory block successfully",
          completed: false,
          xp: 30,
        },
      ],

      memory: { total: 1024, heapUsed: 0, blocks: [] },
      currentEventLog: [],
      commandHistory: [],

      logEvent: (message, type = "info") =>
        set((state) => ({
          currentEventLog: [
            {
              message,
              type,
              id: Date.now(),
              time: new Date().toLocaleTimeString(),
            },
            ...state.currentEventLog,
          ].slice(0, 15),
        })),

      addCommand: (cmd, output) =>
        set((state) => ({
          commandHistory: [...state.commandHistory, { cmd, output }],
        })),

      clearHistory: () =>
        set(() => ({
          commandHistory: [],
        })),

      completeGoal: (goalId) => {
        const { goals, xp } = get();
        const goal = goals.find((g) => g.id === goalId);
        if (goal && !goal.completed) {
          set({
            xp: xp + goal.xp,
            goals: goals.map((g) =>
              g.id === goalId ? { ...g, completed: true } : g
            ),
          });
          get().logEvent(`GOAL ACHIEVED: ${goal.text}`, "success");
        }
      },

      allocateMemory: async (sizeArg, nameArg) => {
        const size = Number(sizeArg);
        const name =
          nameArg || `Block_${Math.floor(Math.random() * 999)}`;

        if (isNaN(size) || size <= 0) {
          get().logEvent("Invalid allocation size", "error");
          return { success: false, error: "Invalid allocation size" };
        }

        const { memory } = get();

        if (memory.heapUsed + size > memory.total) {
          get().logEvent(
            `OUT OF MEMORY: Cannot fit ${size}MB`,
            "error"
          );
          return { success: false, error: "Out of memory" };
        }

        const newBlock = {
          id: `block-${Date.now()}`,
          name,
          size,
        };

        try {
          const response = await gameApi.submitAction("ALLOCATE", {
            name,
            size,
          });

          if (response?.data) {
            set((state) => ({
              memory: {
                ...state.memory,
                heapUsed:
                  response.data.heapUsed ??
                  state.memory.heapUsed + size,
                blocks:
                  response.data.blocks ??
                  [...state.memory.blocks, newBlock],
              },
              xp: response.data.xp ?? state.xp,
            }));
          }
        } catch (err) {
          console.warn("Backend offline: using local mode.");
        }

        set((state) => ({
          memory: {
            ...state.memory,
            heapUsed: state.memory.heapUsed + size,
            blocks: [...state.memory.blocks, newBlock],
          },
        }));

        if (size > 100) get().completeGoal(1);
        if (memory.blocks.length + 1 >= 3)
          get().completeGoal(2);

        get().logEvent(
          `Allocated ${size}MB to ${name}`,
          "success"
        );

        return { success: true };
      },

      freeMemory: async (identifier) => {
        const { memory } = get();

        const block = memory.blocks.find(
          (b) =>
            b.name === identifier || b.id === identifier
        );

        if (!block) {
          get().logEvent(
            `Block "${identifier}" not found`,
            "error"
          );
          return { success: false, error: "Block not found" };
        }

        try {
          await gameApi.submitAction("FREE", {
            id: block.id,
            name: block.name,
          });
        } catch (e) {
          console.warn("Backend offline: freeing locally.");
        }

        set((state) => ({
          memory: {
            ...state.memory,
            heapUsed:
              state.memory.heapUsed - block.size,
            blocks: state.memory.blocks.filter(
              (b) => b.id !== block.id
            ),
          },
        }));

        get().completeGoal(3);

        get().logEvent(
          `Freed ${block.size}MB from ${block.name}`,
          "info"
        );

        return { success: true };
      },
    }),
    {
      name: "codeconquer-os-session",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useGameStore1;