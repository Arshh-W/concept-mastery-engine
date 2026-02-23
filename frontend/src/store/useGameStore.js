//purpose of this file is to create a store for the game state using Zustand. This will allow us to manage the game state in a centralized location and make it easier to update and access the state from different components.

import { create } from 'zustand';

const useGameStore = create((set) => ({
    sessionId: null,
    commandHistory: [],
    currentEventLog: [],
    memoryBlocks: [], // For the MemoryMap visualizer
    xp: 0,

    memory: {
        total: 256,
        heapUsed: 0,
        stackUsed: 0,
        blocks: [],
    },

    setSession: (id) => set({ sessionId: id }),
    
    addCommand: (cmd, output) => set((state) => ({
        commandHistory: [...state.commandHistory, { cmd, output, timestamp: new Date() }]
    })),

    logEvent: (message, type = 'info') => set((state) => ({
        currentEventLog: [...state.currentEventLog, { message, type, id: Date.now() }]
    })),

    updateXP: (gain) => set((state) => ({ xp: state.xp + gain })),

    setMemoryFromBackend: (memoryData) =>
        set(() => ({
            memory: memoryData,
        })),
}));

export default useGameStore;

// This store includes:
// - sessionId: to track the current game session.
// - commandHistory: an array to store all commands entered by the user along with their outputs and timestamps.
// - currentEventLog: an array to log events that occur during the game, which can be displayed in the EventLog component.
// - memoryBlocks: an array to represent the state of memory blocks for visualization in the MemoryMap component.
// - xp: a numeric value to track the player's experience points, which can be updated based on their actions in the game.