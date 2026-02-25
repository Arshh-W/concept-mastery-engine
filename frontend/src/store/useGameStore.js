import { create } from 'zustand';
import { gameApi } from '../services/api';

// --- HELPER: B-TREE LOGIC ---
const insertAndSplit = (node, val) => {
    if (!node) return { id: Math.random(), values: [val], children: null };

    if (node.children && node.children.length > 0) {
        let childIdx = node.values.findIndex(v => val < v);
        if (childIdx === -1) childIdx = node.values.length;
        
        if (!node.children[childIdx]) {
            node.children[childIdx] = { id: Math.random(), values: [], children: null };
        }
        node.children[childIdx] = insertAndSplit(node.children[childIdx], val);
    } 
    else {
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
                { 
                    id: Math.random(), 
                    name: `L_${midVal}`, 
                    values: leftVals, 
                    children: oldChildren.length > 0 ? oldChildren.slice(0, midIdx + 1) : null 
                },
                { 
                    id: Math.random(), 
                    name: `R_${midVal}`, 
                    values: rightVals, 
                    children: oldChildren.length > 0 ? oldChildren.slice(midIdx + 1) : null 
                }
            ]
        };
    }
    return node;
};

// --- STORE DEFINITION ---
const useGameStore = create((set, get) => ({
    // --- STATE ---
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
    
    // Memory state initialized to prevent undefined errors in UI
    memory: {
        total: 1024,
        heapUsed: 0,
        blocks: []
    },

    // --- ACTIONS ---
    logEvent: (message, type = 'info') => set((state) => ({
        currentEventLog: [...state.currentEventLog, { message, type, id: Date.now() }]
    })),

    setSelectedNode: (node) => set({ selectedNode: node }),

    completeGoal: (goalId) => {
        const { goals, xp, logEvent } = get();
        const goal = goals.find(g => g.id === goalId);
        if (goal && !goal.completed) {
            set({
                xp: xp + goal.xp,
                goals: goals.map(g => g.id === goalId ? { ...g, completed: true } : g)
            });
            logEvent(`GOAL ACHIEVED: ${goal.text}`, "success");
        }
    },

    // --- MEMORY ACTIONS (WITH OFFLINE FALLBACK) ---
    allocateMemory: async (name, sizeInput) => {
        const size = parseInt(sizeInput);
        if (isNaN(size) || size <= 0) return get().logEvent("Invalid allocation size", "error");

        const { backendMode, sessionId, memory, logEvent } = get();

        // Guard: Check local capacity
        if (memory.heapUsed + size > memory.total) {
            logEvent(`OUT OF MEMORY: Cannot allocate ${size}MB`, "error");
            return;
        }

        const newBlock = {
            id: `block-${Date.now()}-${Math.random()}`,
            name: name || "Untitled Block",
            size: size
        };

        if (backendMode && sessionId) {
            try {
                // Try to sync with server
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
                    logEvent(`Allocated ${size}MB (Server Synced)`, "success");
                    return;
                }
            } catch (err) {
                logEvent("Backend offline: Allocating locally.", "info");
            }
        }

        // Local fallback logic
        set((state) => ({
            memory: {
                ...state.memory,
                heapUsed: state.memory.heapUsed + size,
                blocks: [...state.memory.blocks, newBlock]
            }
        }));
        if (size > 100) get().completeGoal(5);
        logEvent(`Allocated ${size}MB to ${newBlock.name} (Local)`, "success");
    },

    freeMemory: (blockId) => {
        set((state) => {
            const block = state.memory.blocks.find(b => b.id === blockId);
            if (!block) return state;
            return {
                memory: {
                    ...state.memory,
                    heapUsed: Math.max(0, state.memory.heapUsed - block.size),
                    blocks: state.memory.blocks.filter(b => b.id !== blockId)
                }
            };
        });
        get().logEvent("Memory block released.", "info");
    },

    // --- B-TREE ACTIONS ---
    updateBTree: async (newValue) => {
        const val = parseInt(newValue);
        if (isNaN(val)) return;

        const { backendMode, bTreeData, sessionId, activeTable, dbSchema } = get();

        const getUpdatedSchema = (schema) => {
            const newSchema = JSON.parse(JSON.stringify(schema));
            const targetDb = activeTable?.dbName?.toUpperCase();
            const targetTab = activeTable?.tableName?.toUpperCase();
            const db = newSchema.children.find(d => d.name?.toUpperCase() === targetDb);
            if (db) {
                const table = db.tables.find(t => t.name?.toUpperCase() === targetTab);
                if (table) table.rows += 1;
            }
            return newSchema;
        };

        if (backendMode && sessionId) {
            try {
                const response = await gameApi.submitAction(sessionId, 'INSERT', val);
                if (response?.data) {
                    set({ 
                        bTreeData: response.data.tree_state || bTreeData,
                        xp: response.data.total_xp ?? get().xp,
                        dbSchema: getUpdatedSchema(dbSchema)
                    });
                    get().logEvent(`Index update committed to ${activeTable.tableName}.`, "success");
                    if (response.data.did_split) get().completeGoal(1);
                    return;
                }
            } catch (err) {
                get().logEvent("Backend offline: Falling back to local B-Tree logic.", "info");
            }
        }

        // Local Logic
        const currentTree = JSON.parse(JSON.stringify(bTreeData));
        const updated = insertAndSplit(currentTree, val);
        set({ bTreeData: updated, dbSchema: getUpdatedSchema(dbSchema) });
        if (updated.children && updated.children.length > 0) get().completeGoal(1);
    },

    executeDatabaseCommand: async (fullCommand) => {
        const parts = fullCommand.trim().split(/\s+/);
        const action = parts[0]?.toUpperCase();
        const { dbSchema } = get();
        let newSchema = JSON.parse(JSON.stringify(dbSchema));

        if (action === "ALLOC") {
            const size = parts[1]; 
            if (!size) return get().logEvent("ERROR: Specify allocation size (e.g., ALLOC 64MB)", "error");
            
            get().logEvent(`Memory Space Allocated: ${size}`, "success");
            get().logEvent(`Initializing Virtual Pages...`, "info");
            
            return; 
        }

        if (action === "CREATE") {
            const type = parts[1]?.toUpperCase();
            const name = parts[2];
            if (!name) return get().logEvent("ERROR: Missing name", "error");

            if (type === "DATABASE") {
                newSchema.children.push({ id: `db-${Date.now()}`, name, type: "database", tables: [] });
                get().logEvent(`Created DB: ${name}`, "success");
                if (name.toUpperCase() === "PRODUCTION") get().completeGoal(4);
            } else if (type === "TABLE") {
                const target = get().selectedNode || newSchema.children[newSchema.children.length - 1];
                const idx = newSchema.children.findIndex(d => d.name === target?.name);
                if (idx !== -1) {
                    newSchema.children[idx].tables.push({ name, rows: 0, columns: ["id"] });
                    set({ activeTable: { dbName: target.name, tableName: name } });
                    get().logEvent(`Table ${name} created and selected.`, "success");
                }
            }
        } 
        else if (action === "USE") {
            const name = parts[1];
            const found = newSchema.children.find(db => db.name?.toUpperCase() === name?.toUpperCase());
            if (found) {
                set({ 
                    selectedNode: found, 
                    activeTable: { dbName: found.name, tableName: found.tables[0]?.name || "" } 
                });
                get().logEvent(`Switched to: ${found.name}`, "success");
            } else {
                get().logEvent(`Database ${name} not found`, "error");
            }
        }
        set({ dbSchema: newSchema });
    },

    searchKey: async (key) => {
        const val = parseInt(key);
        if (isNaN(val)) return;
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

    addCommand: (cmd, output) => set((state) => ({
        commandHistory: [...state.commandHistory, { cmd, output, timestamp: new Date() }]
    })),
    clearHistory: () => set({ commandHistory: [] }),
}));

export default useGameStore;