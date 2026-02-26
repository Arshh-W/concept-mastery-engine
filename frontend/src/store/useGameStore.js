import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { gameApi } from "../services/api";

const insertAndSplit = (node, val) => {
  if (!node) return { id: Math.random(), values: [val], children: null };

  if (node.children && node.children.length > 0) {
    let childIdx = node.values.findIndex((v) => val < v);
    if (childIdx === -1) childIdx = node.values.length;

    if (!node.children[childIdx]) {
      node.children[childIdx] = {
        id: Math.random(),
        values: [],
        children: null,
      };
    }

    node.children[childIdx] = insertAndSplit(
      node.children[childIdx],
      val
    );
  } else {
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
          children:
            oldChildren.length > 0
              ? oldChildren.slice(0, midIdx + 1)
              : null,
        },
        {
          id: Math.random(),
          name: `R_${midVal}`,
          values: rightVals,
          children:
            oldChildren.length > 0
              ? oldChildren.slice(midIdx + 1)
              : null,
        },
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

      goals: [
        { id: 1, text: "Insert keys to trigger a root split", completed: false, xp: 50 },
        { id: 2, text: "Perform a SELECT query with traversal highlight", completed: false, xp: 50 },
        { id: 4, text: "Create a custom Production Database", completed: false, xp: 75 }
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
          {
            id: "db-1",
            name: "Ecommerce_DB",
            type: "database",
            tables: [{ name: "Users", rows: 150, columns: ["id", "name"] }],
          },
        ],
      },

      bTreeData: { id: "root", values: [50], children: null },

      logEvent: (message, type = "info") =>
        set((state) => ({
          currentEventLog: [
            ...state.currentEventLog,
            { message, type, id: Date.now() },
          ],
        })),

      addCommand: (cmd, output) =>
        set((state) => ({
          commandHistory: [
            ...state.commandHistory,
            { cmd, output, timestamp: new Date() },
          ],
        })),

      clearHistory: () => set({ commandHistory: [] }),

      setSelectedNode: (node) => set({ selectedNode: node }),

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

      updateBTree: async (newValue) => {
        const val = parseInt(newValue);
        if (isNaN(val)) return { success: false };

        const { backendMode, bTreeData, sessionId } = get();

        if (backendMode && sessionId) {
          try {
            const response = await gameApi.submitAction(
              sessionId,
              "INSERT",
              val
            );

            if (response?.data) {
              set({
                bTreeData: response.data.tree_state || bTreeData,
                xp: response.data.total_xp ?? get().xp,
              });

              if (response.data.did_split)
                get().completeGoal(1);

              return { success: true };
            }
          } catch {
            get().logEvent(
              "Backend offline: Using local B-Tree logic.",
              "info"
            );
          }
        }

        const currentTree = JSON.parse(JSON.stringify(bTreeData));
        const updated = insertAndSplit(currentTree, val);

        set({ bTreeData: updated });

        if (updated.children)
          get().completeGoal(1);

        return { success: true };
      },

      searchKey: async (key) => {
        const val = parseInt(key);
        if (isNaN(val)) return { success: false };

        const searchPath = [];

        const traverse = (node) => {
          if (!node) return;
          searchPath.push(node.id);

          if (node.values?.includes(val)) return;

          if (node.children) {
            let idx = node.values.findIndex((v) => val < v);
            if (idx === -1) idx = node.values.length;
            traverse(node.children[idx]);
          }
        };

        traverse(get().bTreeData);

        for (let i = 0; i < searchPath.length; i++) {
          set({
            highlightedNodes: searchPath.slice(0, i + 1),
          });
          await new Promise((r) => setTimeout(r, 500));
        }

        get().completeGoal(2);

        setTimeout(() => set({ highlightedNodes: [] }), 1500);

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

          if (!name)
            return { success: false, error: "Missing name" };

          if (type === "DATABASE") {
            newSchema.children.push({
              id: `db-${Date.now()}`,
              name,
              type: "database",
              tables: [],
            });

            set({ dbSchema: newSchema });
            return { success: true };
          }

          if (type === "TABLE") {
            const targetDbName =
              get().selectedNode?.name ||
              get().activeTable?.dbName;

            const dbIndex = newSchema.children.findIndex(
              (db) =>
                db.name?.toUpperCase() ===
                targetDbName?.toUpperCase()
            );

            if (dbIndex === -1)
              return { success: false, error: "Database not found" };

            newSchema.children[dbIndex].tables.push({
              name,
              rows: 0,
              columns: ["id"],
            });

            set({
              dbSchema: newSchema,
              activeTable: {
                dbName: newSchema.children[dbIndex].name,
                tableName: name,
              },
            });

            return { success: true };
          }
        }

        if (action === "USE") {
          const name = parts[1];
          const found = newSchema.children.find(
            (db) =>
              db.name?.toUpperCase() ===
              name?.toUpperCase()
          );

          if (!found)
            return {
              success: false,
              error: "Database not found",
            };

          set({
            selectedNode: found,
            activeTable: {
              dbName: found.name,
              tableName: found.tables[0]?.name || "",
            },
          });

          return { success: true };
        }

        return { success: false };
      },
    }),
    {
      name: "codeconquer-dbms-session",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useGameStore;