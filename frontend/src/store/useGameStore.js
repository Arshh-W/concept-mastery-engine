import { create } from 'zustand';
import { gameApi } from '../services/api';

// --- HELPER: B-TREE LOGIC (UNCHANGED) ---
const insertAndSplit = (node, val) => {
    if (!node) return { id: Math.random(), values: [val], children: null };
    if (node.children && node.children.length > 0) {
        let childIdx = node.values.findIndex(v => val < v);
        if (childIdx === -1) childIdx = node.values.length;
        if (!node.children[childIdx]) {
            node.children[childIdx] = { id: Math.random(), values: [], children: null };
        }
        node.children[childIdx] = insertAndSplit(node.children[childIdx], val);
    } else {
        if (!node.values) node.values = [];
        if (!node.values.includes(val)) {
            node.values.push(val);
            node.values.sort((a, b) => a - b);
        }
    }
    if (node.values.length > 2) {
        const midIdx = Math.floor(node.values.length / 2);
        const midVal = node.values[midIdx];
        const leftVals = node.values.slice(0, midIdx);
        const rightVals = node.values.slice(midIdx + 1);
        const oldChildren = node.children || [];
        return {
            id: `split-${Date.now()}-${Math.random()}`,
            values: [midVal],
            children: [
                { id: Math.random(), name: `L_${midVal}`, values: leftVals, children: oldChildren.length > 0 ? oldChildren.slice(0, midIdx + 1) : null },
                { id: Math.random(), name: `R_${midVal}`, values: rightVals, children: oldChildren.length > 0 ? oldChildren.slice(midIdx + 1) : null }
            ]
        };
    }
    return node;
};

const useGameStore = create((set, get) => ({
    // --- INITIAL STATE ---
    backendMode: true,
    sessionId: null,
    xp: 0,
    goals: [
        { id: 1, text: "Insert keys to trigger a root split", completed: false, xp: 50 },
        { id: 2, text: "Perform a SELECT query with traversal highlight", completed: false, xp: 50 },
        { id: 4, text: "Create a custom Production Database", completed: false, xp: 75 },
        { id: 5, text: "Allocate a memory block over 100MB", completed: false, xp: 40 }
    ],
    highlightedNodes: [],
    currentEventLog: [],
    commandHistory: [],
    selectedNode: null, 
    activeTable: { dbName: "Ecommerce_DB", tableName: "Users" }, 
    dbSchema: {
        id: "server-root",
        name: "SQL_SERVER_01",
        type: "server",
        children: [
            { id: "db-1", name: "Ecommerce_DB", type: "database", tables: [{ name: "Users", rows: 150, columns: ["id", "name"] }] }
        ]
    },
    bTreeData: { id: "root", values: [50], children: null },
    
    // Fix: Ensures memory properties are defined to prevent UI crashes
    memory: { total: 1024, heapUsed: 0, blocks: [] },

    // --- ACTIONS ---
    logEvent: (message, type = 'info') => set((state) => ({
        currentEventLog: [...state.currentEventLog, { message, type, id: Date.now() }]
    })),

    // --- UPDATED ALLOCATION LOGIC ---
    allocateMemory: async (arg1, arg2) => {
        // Correctly handle inputs like 'alloc 200' or 'alloc 50 A'
        let size = parseInt(arg1);
        let name = arg2 || `Block_${Math.floor(Math.random() * 999)}`;

        // If the first argument wasn't a number (e.g., 'alloc MyData 50')
        if (isNaN(size)) {
            size = parseInt(arg2);
            name = arg1;
        }

        if (isNaN(size) || size <= 0) {
            return get().logEvent("Invalid allocation size", "error");
        }

        const { memory, logEvent, backendMode, sessionId } = get();

        if (memory.heapUsed + size > memory.total) {
            return logEvent(`OUT OF MEMORY: Cannot allocate ${size}MB`, "error");
        }

        const newBlock = { id: `block-${Date.now()}`, name, size };

        // Attempt Backend Sync
        if (backendMode && sessionId) {
            try {
                const response = await gameApi.submitAction(sessionId, 'ALLOCATE', { name, size });
                if (response?.data) {
                    set((state) => ({
                        memory: {
                            ...state.memory,
                            heapUsed: response.data.heapUsed || (state.memory.heapUsed + size),
                            blocks: response.data.blocks || [...state.memory.blocks, newBlock]
                        },
                        xp: response.data.total_xp ?? state.xp
                    }));
                    if (size > 100) get().completeGoal(5);
                    logEvent(`Allocated ${size}MB (Synced)`, "success");
                    return;
                }
            } catch (err) {
                logEvent("Backend offline: Entering local mode.", "info");
            }
        }

        // Local State Fallback
        set((state) => ({
            memory: {
                ...state.memory,
                heapUsed: state.memory.heapUsed + size,
                blocks: [...state.memory.blocks, newBlock]
            }
        }));
        if (size > 100) get().completeGoal(5);
        logEvent(`Allocated ${size}MB to ${name} (Local)`, "success");
    },

    // --- TERMINAL COMMAND EXECUTOR ---
    executeDatabaseCommand: async (fullCommand) => {
        const parts = fullCommand.trim().split(/\s+/);
        const action = parts[0]?.toUpperCase();

        // Fix: Route 'ALLOC' terminal input to the allocateMemory action
        if (action === "ALLOC" || action === "ALLOCATE") {
            if (parts.length < 2) return get().logEvent("ERROR: alloc requires a size.", "error");
            return get().allocateMemory(parts[1], parts[2]);
        }

        const { dbSchema } = get();
        let newSchema = JSON.parse(JSON.stringify(dbSchema));

        if (action === "CREATE") {
            const type = parts[1]?.toUpperCase();
            const name = parts[2];
            if (type === "DATABASE" && name) {
                newSchema.children.push({ id: `db-${Date.now()}`, name, type: "database", tables: [] });
                get().logEvent(`Created DB: ${name}`, "success");
                if (name.toUpperCase() === "PRODUCTION") get().completeGoal(4);
            }
        } else if (action === "USE") {
            const name = parts[1];
            const found = newSchema.children.find(db => db.name?.toUpperCase() === name?.toUpperCase());
            if (found) {
                set({ selectedNode: found });
                get().logEvent(`Switched to: ${found.name}`, "success");
            }
        }
        set({ dbSchema: newSchema });
    },

    // --- B-TREE & HISTORY ACTIONS ---
    updateBTree: async (newValue) => {
        const val = parseInt(newValue);
        if (isNaN(val)) return;
        const currentTree = JSON.parse(JSON.stringify(get().bTreeData));
        const updated = insertAndSplit(currentTree, val);
        set({ bTreeData: updated });
        if (updated.children && updated.children.length > 0) get().completeGoal(1);
    },
    addCommand: (cmd, output) => set((state) => ({
        commandHistory: [...state.commandHistory, { cmd, output, timestamp: new Date() }]
    })),
    clearHistory: () => set({ commandHistory: [] }),
}));

export default useGameStore;