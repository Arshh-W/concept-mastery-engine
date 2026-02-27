import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { gameApi } from "../services/api";
import { getTopicConfig } from "../config/topicConfig";

const insertAndSplit = (node, val) => {
  if (!node) return { id: Math.random(), values: [val], children: null };

  if (node.children && node.children.length > 0) {
    let idx = node.values.findIndex(v => val < v);
    if (idx === -1) idx = node.values.length;
    if (!node.children[idx]) node.children[idx] = { id: Math.random(), values: [], children: null };
    node.children[idx] = insertAndSplit(node.children[idx], val);
  } else {
    if (!node.values.includes(val)) {
      node.values.push(val);
      node.values.sort((a, b) => a - b);
    }
  }

  if (node.values.length > 2) {
    const mid = Math.floor(node.values.length / 2);
    const midVal = node.values[mid];
    const leftVals = node.values.slice(0, mid);
    const rightVals = node.values.slice(mid + 1);
    const oldC = node.children || [];
    return {
      id: `split-${Date.now()}-${Math.random()}`,
      values: [midVal],
      _didSplit: true,
      children: [
        { id: Math.random(), name: `L_${midVal}`, values: leftVals, children: oldC.length > 0 ? oldC.slice(0, mid + 1) : null },
        { id: Math.random(), name: `R_${midVal}`, values: rightVals, children: oldC.length > 0 ? oldC.slice(mid + 1) : null },
      ],
    };
  }
  return node;
};

const useGameStore = create(
  persist(
    (set, get) => ({
      backendMode: true,
      sessionId: null,
      xp: 0,

      // DBMS-specific counters for goal evaluation
      insertCount: 0,
      searchCount: 0,
      splitCount:  0,
      lastError:   null,

      goals: [],
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
          {
            id: "db-1",
            name: "Ecommerce_DB",
            type: "database",
            tables: [{ name: "Users", rows: 150, columns: ["id", "name", "email"] }],
          },
        ],
      },

      bTreeData: { id: "root", values: [50], children: null },

      logEvent: (message, type = "info") =>
        set(state => ({
          currentEventLog: [...state.currentEventLog, { message, type, id: Date.now() }],
        })),

      addCommand: (cmd, output) =>
        set(state => ({
          commandHistory: [...state.commandHistory, { cmd, output, timestamp: new Date() }],
        })),

      clearHistory: () => set({ commandHistory: [] }),

      resetSession: (slug) => {
        const config = getTopicConfig(slug);
        const freshGoals = config.goals.map(g => ({ ...g, completed: false }));
        set({
          goals: freshGoals,
          bTreeData: { id: "root", values: [50], children: null },
          currentEventLog: [],
          commandHistory: [],
          highlightedNodes: [],
          insertCount: 0,
          searchCount: 0,
          splitCount:  0,
          lastError:   null,
          xp: 0,
          // reset schema to default
          dbSchema: {
            id: "server-root",
            name: "SQL_SERVER_01",
            type: "server",
            children: [
              {
                id: "db-1",
                name: "Ecommerce_DB",
                type: "database",
                tables: [{ name: "Users", rows: 150, columns: ["id", "name", "email"] }],
              },
            ],
          },
          activeTable: { dbName: "Ecommerce_DB", tableName: "Users" },
        });
      },

      evaluateGoals: () => {
        const { goals, bTreeData, dbSchema, activeTable, insertCount, searchCount, splitCount, lastError } = get();
        const snap = { bTreeData, dbSchema, activeTable, insertCount, searchCount, splitCount, lastError };
        goals.forEach(goal => {
          if (!goal.completed && typeof goal.check === "function" && goal.check(snap)) {
            get().completeGoal(goal.id);
          }
        });
      },

      setSelectedNode: node => set({ selectedNode: node }),

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

      updateBTree: async (newValue) => {
        const val = parseInt(newValue);
        if (isNaN(val)) return { success: false };

        const currentTree = JSON.parse(JSON.stringify(get().bTreeData));
        const updated = insertAndSplit(currentTree, val);
        const didSplit = !!updated._didSplit || (updated.children && !currentTree.children);

        // Clean internal flag
        delete updated._didSplit;

        set(state => ({
          bTreeData: updated,
          insertCount: state.insertCount + 1,
          splitCount:  state.splitCount + (didSplit ? 1 : 0),
          lastError:   null,
        }));

        get().logEvent(`Inserted key ${val} into B-Tree`, "success");
        get().evaluateGoals();
        return { success: true, didSplit };
      },

      searchKey: async (key) => {
        const val = parseInt(key);
        if (isNaN(val)) return { success: false };

        const path = [];
        const traverse = node => {
          if (!node) return;
          path.push(node.id);
          if (node.values?.includes(val)) return;
          if (node.children) {
            let idx = node.values.findIndex(v => val < v);
            if (idx === -1) idx = node.values.length;
            traverse(node.children[idx]);
          }
        };
        traverse(get().bTreeData);

        for (let i = 0; i < path.length; i++) {
          set({ highlightedNodes: path.slice(0, i + 1) });
          await new Promise(r => setTimeout(r, 500));
        }

        set(state => ({ searchCount: state.searchCount + 1 }));
        get().logEvent(`SELECT ${val} — traversed ${path.length} node(s)`, "info");
        setTimeout(() => set({ highlightedNodes: [] }), 1500);
        get().evaluateGoals();
        return { success: true };
      },

      executeDatabaseCommand: async (fullCommand) => {
        const parts = fullCommand.trim().split(/\s+/);
        const action = parts[0]?.toUpperCase();
        const { dbSchema } = get();
        let newSchema = JSON.parse(JSON.stringify(dbSchema));

        if (action === "CREATE") {
          const type = parts[1]?.toUpperCase();
          const name = parts[2];
          if (!name) return { success: false, error: "Missing name" };

          if (type === "DATABASE") {
            if (newSchema.children.some(db => db.name?.toLowerCase() === name.toLowerCase())) {
              return { success: false, error: `Database "${name}" already exists` };
            }
            newSchema.children.push({ id: `db-${Date.now()}`, name, type: "database", tables: [] });
            set({ dbSchema: newSchema });
            get().logEvent(`Created database: ${name}`, "success");
            get().evaluateGoals();
            return { success: true };
          }

          if (type === "TABLE") {
            const targetDb = get().activeTable?.dbName;
            const dbIdx = newSchema.children.findIndex(db => db.name?.toUpperCase() === targetDb?.toUpperCase());
            if (dbIdx === -1) return { success: false, error: `No active database. Run USE [name] first.` };
            newSchema.children[dbIdx].tables.push({ name, rows: 0, columns: ["id"] });
            set({ dbSchema: newSchema, activeTable: { dbName: newSchema.children[dbIdx].name, tableName: name } });
            get().logEvent(`Created table: ${name} in ${targetDb}`, "success");
            get().evaluateGoals();
            return { success: true };
          }
        }

        if (action === "USE") {
          const name = parts[1];
          const found = newSchema.children.find(db => db.name?.toUpperCase() === name?.toUpperCase());
          if (!found) return { success: false, error: `Database "${name}" not found` };
          set({ selectedNode: found, activeTable: { dbName: found.name, tableName: found.tables[0]?.name || "" } });
          get().logEvent(`Switched to database: ${name}`, "info");
          get().evaluateGoals();
          return { success: true };
        }

        return { success: false, error: `Unknown command: ${fullCommand}` };
      },
    }),
    { name: "codeconquer-dbms-session", storage: createJSONStorage(() => localStorage) }
  )
);

export default useGameStore;
