import { create } from 'zustand';
import { gameApi } from '../services/api';

// --- LOCAL B-TREE SIMULATION (Fallback Logic) ---
const insertAndSplit = (node, val) => {
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
            { 
                id: Math.random(), 
                name: `P_LEFT_${midVal}`, 
                type: 'database', 
                values: leftVals, 
                tables: [{ name: "Users", rows: 10, columns: ["id", "val"] }],
                children: leftChildren 
            },
            { 
                id: Math.random(), 
                name: `P_RIGHT_${midVal}`, 
                type: 'database', 
                values: rightVals, 
                tables: [{ name: "Logs", rows: 5, columns: ["id", "val"] }],
                children: rightChildren 
            }
        ];
    }
    return node;
};

const useGameStore = create((set, get) => ({
    // --- CONNECTION STATE ---
    backendMode: true, // Toggle this to false for offline testing
    sessionId: null,
    user: null,

    // --- PROGRESS STATE ---
    xp: 0,
    goals: [
        { id: 1, text: "Insert keys to trigger a root split", completed: false, xp: 50 },
        { id: 2, text: "Perform a SELECT query with traversal highlight", completed: false, xp: 50 },
        { id: 3, text: "Reach a tree height of 3", completed: false, xp: 100 }
    ],

    // --- GAME ENGINE STATE ---
    highlightedNodes: [],
    currentEventLog: [],
    commandHistory: [],
    selectedNode: null,

    // --- DOMAIN DATA ---
    memory: { total: 256, heapUsed: 0, stackUsed: 0, blocks: [] },
    bTreeData: { id: "root", values: [50], children: null },
    dbSchema: {
        id: "server-root",
        name: "SQL_SERVER_01",
        type: "server",
        children: [
            { 
                id: "db-1", name: "Ecommerce_DB", type: "database",
                tables: [
                    { name: "Users", rows: 150, columns: ["id", "name", "email"] },
                    { name: "Orders", rows: 45, columns: ["id", "user_id", "total"] }
                ]
            }
        ]
    },

    // --- SETTERS ---
    setUser: (userData) => set({ user: userData }),
    setSelectedNode: (node) => set({ selectedNode: node }),
    setSession: (id) => set({ sessionId: id }),

    // --- LOGGING ---
    logEvent: (message, type = 'info') => set((state) => ({
        currentEventLog: [...state.currentEventLog, { message, type, id: Date.now() }]
    })),

    addCommand: (cmd, output) => set((state) => ({
        commandHistory: [...state.commandHistory, { cmd, output, timestamp: new Date() }]
    })),

    // --- CORE ACTIONS (The Bridge to Backend) ---

    updateBTree: async (newValue) => {
        const val = parseInt(newValue);
        const { backendMode, bTreeData, completeGoal, logEvent, sessionId } = get();

        if (backendMode) {
            try {
                // Real call to Python Backend
                const response = await gameApi.submitAction(sessionId, 'INSERT', val);
                
                // We update our local state with whatever the Backend B-Tree looks like now
                set({ 
                    bTreeData: response.data.tree_state, 
                    xp: response.data.total_xp || get().xp 
                });

                logEvent(`Remote Kernel: Key ${val} indexed.`, "success");
                if (response.data.did_split) completeGoal(1);

            } catch (err) {
                logEvent("Backend unreachable. Falling back to local simulation.", "error");
                // Local Fallback
                const newTree = JSON.parse(JSON.stringify(bTreeData));
                const updated = insertAndSplit(newTree, val);
                set({ bTreeData: updated });
            }
        } else {
            const newTree = JSON.parse(JSON.stringify(bTreeData));
            const updated = insertAndSplit(newTree, val);
            set({ bTreeData: updated });
            if (updated.children && updated.children.length > 0) completeGoal(1);
        }
    },

    searchKey: async (key) => {
        const val = parseInt(key);
        const { bTreeData, completeGoal, logEvent } = get();
        const searchPath = [];

        const traverse = (node) => {
            if (!node) return;
            searchPath.push(node.id);
            if (node.values?.includes(val)) return;
            if (node.children) {
                let idx = node.values.findIndex(v => val < v);
                if (idx === -1) idx = node.values.length;
                traverse(node.children[idx]);
            }
        };

        traverse(bTreeData);

        logEvent(`Initializing index scan for key: ${val}...`, "info");
        
        for (let i = 0; i < searchPath.length; i++) {
            set({ highlightedNodes: searchPath.slice(0, i + 1) });
            await new Promise(r => setTimeout(r, 600));
        }

        completeGoal(2);
        setTimeout(() => set({ highlightedNodes: [] }), 2000);
    },

    completeGoal: (goalId) => set((state) => {
        const goal = state.goals.find(g => g.id === goalId);
        if (goal && !goal.completed) {
            return {
                xp: state.xp + goal.xp,
                goals: state.goals.map(g => g.id === goalId ? { ...g, completed: true } : g)
            };
        }
        return state;
    }),

    clearHistory: () => set({ commandHistory: [] }),
}));

export default useGameStore;