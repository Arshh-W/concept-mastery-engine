import { create } from 'zustand';

// --- B-TREE ALGORITHM (For Indexing Missions) ---
// const insertAndSplit = (node, val) => {
//     if (!node.values) node.values = []; // Safety check
    
//     if (!node.children) {
//         if (!node.values.includes(val)) {
//             node.values.push(val);
//             node.values.sort((a, b) => a - b);
//         }
//     } else {
//         let childIdx = node.values.findIndex(v => val < v);
//         if (childIdx === -1) childIdx = node.values.length;
//         insertAndSplit(node.children[childIdx], val);
//     }

//     if (node.values.length > 2) {
//         const midIdx = Math.floor(node.values.length / 2);
//         const midVal = node.values[midIdx];
//         const leftVals = node.values.slice(0, midIdx);
//         const rightVals = node.values.slice(midIdx + 1);

//         const oldChildren = node.children || [];
//         const leftChildren = oldChildren.length > 0 ? oldChildren.slice(0, midIdx + 1) : null;
//         const rightChildren = oldChildren.length > 0 ? oldChildren.slice(midIdx + 1) : null;

//         node.values = [midVal];
//         node.children = [
//             { id: Math.random(), values: leftVals, children: leftChildren },
//             { id: Math.random(), values: rightVals, children: rightChildren }
//         ];
//     }
//     return node;
// };
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
        
        // ADDING METADATA HERE: This makes the Inspector work
       // Inside insertAndSplit when creating new children:
        node.children = [
        { 
            id: Math.random(), 
            name: `P_LEFT_${midVal}`, // Shorter name
            type: 'database', 
            values: leftVals, 
            tables: [{ name: "Users", rows: 10, columns: ["id", "val"] }],
            children: leftChildren 
        },
        { 
            id: Math.random(), 
            name: `P_RIGHT_${midVal}`, // Shorter name
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
    backendMode: false,
    xp: 0,
    highlightedNodes: [], // Fixed: Added initialization to prevent .includes() crash
    
    // --- MISSION DATA ---
    goals: [
        { id: 1, text: "Insert keys to trigger a root split", completed: false, xp: 50 },
        { id: 2, text: "Perform a SELECT query with traversal highlight", completed: false, xp: 50 },
        { id: 3, text: "Reach a tree height of 3", completed: false, xp: 100 }
    ],

    // --- OS STATE ---
    memory: { total: 256, heapUsed: 0, stackUsed: 0, blocks: [] },

    // --- DBMS STATE ---
    // 1. Schema Data (The Server/DB/Table view)
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
            },
            { 
                id: "db-2", name: "Analytics_DB", type: "database",
                tables: [{ name: "Traffic_Log", rows: 1200, columns: ["timestamp", "ip", "page"] }]
            }
        ]
    },

    // 2. Index Data (The numeric B-Tree view)
    bTreeData: { id: "root", values: [50], children: null },

    selectedNode: null,
    setSelectedNode: (node) => set({ selectedNode: node }),

    // --- ACTIONS ---
    logEvent: (message, type = 'info') => set((state) => ({
        currentEventLog: [...(state.currentEventLog || []), { message, type, id: Date.now() }]
    })),

    addCommand: (cmd, output) => set((state) => ({
        commandHistory: [...(state.commandHistory || []), { cmd, output, timestamp: new Date() }]
    })),

    updateBTree: async (newValue) => {
        const val = parseInt(newValue);
        const { backendMode, bTreeData, completeGoal } = get();

        if (backendMode) {
            console.log("Calling Python Backend...");
        } else {
            const newTree = JSON.parse(JSON.stringify(bTreeData));
            const updated = insertAndSplit(newTree, val);
            set({ bTreeData: updated });
            if (updated.children && updated.children.length > 0) completeGoal(1);
        }
    },

    searchKey: async (key) => {
        const val = parseInt(key);
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
        traverse(get().bTreeData);
        for (let i = 0; i < searchPath.length; i++) {
            set({ highlightedNodes: searchPath.slice(0, i + 1) });
            await new Promise(r => setTimeout(r, 600));
        }
        get().completeGoal(2);
        setTimeout(() => set({ highlightedNodes: [] }), 2000);
    },

    completeGoal: (goalId) => set((state) => {
        const goal = state.goals.find(g => g.id === goalId);
        if (goal && !goal.completed) {
            get().logEvent(`Objective Complete: ${goal.text}`, "success");
            return {
                xp: state.xp + goal.xp,
                goals: state.goals.map(g => g.id === goalId ? { ...g, completed: true } : g)
            };
        }
        return state;
    }),
    
    clearHistory: () => set({ commandHistory: [] }),
    setMemoryFromBackend: (memoryData) => set({ memory: memoryData }),
}));

export default useGameStore;