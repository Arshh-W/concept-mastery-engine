import { create } from 'zustand';

const insertAndSplit = (node, val) => {
    // 1. Recursive find leaf and insert
    if (!node.children) {
        if (!node.values.includes(val)) {
            node.values.push(val);
            node.values.sort((a, b) => a - b);
        }
    } else {
        let childIdx = node.values.findIndex(v => val < v);
        if (childIdx === -1) childIdx = node.values.length;
        insertAndSplit(node.children[childIdx], val);
    }

    // 2. Splitting Logic (Max 2 keys per node)
    if (node.values.length > 2) {
        const midIdx = Math.floor(node.values.length / 2);
        const midVal = node.values[midIdx];
        const leftVals = node.values.slice(0, midIdx);
        const rightVals = node.values.slice(midIdx + 1);

        const oldChildren = node.children || [];
        const leftChildren = oldChildren.length > 0 ? oldChildren.slice(0, midIdx + 1) : null;
        const rightChildren = oldChildren.length > 0 ? oldChildren.slice(midIdx + 1) : null;

        node.values = [midVal];
        node.children = [
            { id: Math.random(), values: leftVals, children: leftChildren },
            { id: Math.random(), values: rightVals, children: rightChildren }
        ];
    }
    return node;
};

const useGameStore = create((set, get) => ({
    // --- APP CONFIG ---
    backendMode: false, // will set it to TRUE once Python API is live

    // --- SESSION & PROGRESS ---
    sessionId: null,
    xp: 0,
    goals: [
        { id: 1, text: "Insert keys to trigger a root split", completed: false, xp: 50 },
        { id: 2, text: "Perform a SELECT query with traversal highlight", completed: false, xp: 50 },
        { id: 3, text: "Reach a tree height of 3", completed: false, xp: 100 }
    ],

    // --- LOGS & HISTORY ---
    commandHistory: [],
    currentEventLog: [],

    // --- OS STATE ---
    memory: { total: 256, heapUsed: 0, stackUsed: 0, blocks: [] },

    // --- DBMS STATE (B-Tree) ---
    bTreeData: { id: "root", values: [50], children: null },
    highlightedNodes: [],

    // --- GENERAL ACTIONS ---
    setSession: (id) => set({ sessionId: id }),
    updateXP: (gain) => set((state) => ({ xp: state.xp + gain })),
    logEvent: (message, type = 'info') => set((state) => ({
        currentEventLog: [...state.currentEventLog, { message, type, id: Date.now() }]
    })),
    addCommand: (cmd, output) => set((state) => ({
        commandHistory: [...state.commandHistory, { cmd, output, timestamp: new Date() }]
    })),

    // --- DBMS LOGIC ---
    updateBTree: async (newValue) => {
        const val = parseInt(newValue);
        const { backendMode, bTreeData, completeGoal, updateXP } = get();

        if (backendMode) {
            // BACKEND READY: Replace with axios.post('/dbms/insert', { val })
            console.log("Calling Python Backend...");
        } else {
            // FRONTEND SIMULATION
            const newTree = JSON.parse(JSON.stringify(bTreeData));
            const updated = insertAndSplit(newTree, val);
            
            set({ bTreeData: updated });

            // Check if split happened (Goal 1)
            if (updated.children && updated.children.length > 0) {
                completeGoal(1);
            }
        }
    },

    clearHistory: () => set({ commandHistory: [] }),
    
    searchKey: async (key) => {
        const val = parseInt(key);
        const searchPath = [];
        
        const traverse = (node) => {
            if (!node) return;
            searchPath.push(node.id);
            if (node.values.includes(val)) return;
            if (node.children) {
                let idx = node.values.findIndex(v => val < v);
                if (idx === -1) idx = node.values.length;
                traverse(node.children[idx]);
            }
        };

        traverse(get().bTreeData);

        // Animate the path in the UI
        for (let i = 0; i < searchPath.length; i++) {
            set({ highlightedNodes: searchPath.slice(0, i + 1) });
            await new Promise(r => setTimeout(r, 600));
        }
        
        get().completeGoal(2);
        setTimeout(() => set({ highlightedNodes: [] }), 2000);
    },

    // --- MISSION LOGIC ---
    completeGoal: (goalId) => set((state) => {
        const goal = state.goals.find(g => g.id === goalId);
        if (goal && !goal.completed) {
            state.logEvent(`Objective Complete: ${goal.text}`, "success");
            state.updateXP(goal.xp);
            return {
                goals: state.goals.map(g => g.id === goalId ? { ...g, completed: true } : g)
            };
        }
        return state;
    }),

    setMemoryFromBackend: (memoryData) => set({ memory: memoryData }),
}));

export default useGameStore;