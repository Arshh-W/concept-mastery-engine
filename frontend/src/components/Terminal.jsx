import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import useGameStore from "../store/useGameStore";
import useGameStore1 from "../store/use1";
import { getTopicConfig, SIMULATOR } from "../config/topicConfig";
import "./Terminal.css";

const Terminal = () => {
  const { domain, module } = useParams();
  const [input, setInput]           = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalEndRef = useRef(null);

  const config   = getTopicConfig(module);
  const isBtree  = config.simulator === SIMULATOR.BTREE;
  const isSchema = config.simulator === SIMULATOR.SCHEMA;
  const isMemory = config.simulator === SIMULATOR.MEMORY;

  const dbmsStore = useGameStore();
  const osStore   = useGameStore1();
  const activeStore = domain === "os" ? osStore : dbmsStore;
  const { commandHistory = [], addCommand, clearHistory } = activeStore;

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [commandHistory]);

  // Build autocomplete from topic commands
  const validCmds = config.commands.map(c => c.cmd.split(" ")[0].toUpperCase());

  const handleKeyDown = e => {
    if (e.key === "Enter") { processCommand(); return; }
    if (e.key === "ArrowUp" && commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      setInput(commandHistory[commandHistory.length - 1 - idx].cmd);
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const match = validCmds.find(c => c.startsWith(input.toUpperCase()));
      if (match) setInput(match + " ");
    }
  };

  const processCommand = async () => {
    const raw = input.trim();
    if (!raw) return;

    const parts  = raw.split(/\s+/);
    const action = parts[0].toUpperCase();

    setInput("");
    setHistoryIndex(-1);

    // ── Universal commands ──────────────────────────────────────────────
    if (action === "CLEAR") { clearHistory?.(); return; }

    if (action === "HELP") {
      const lines = config.commands.map(c => `  ${c.cmd.padEnd(30)} — ${c.desc}`).join("\n");
      addCommand(raw, `Available commands:\n${lines}\n\nTip: ${config.terminalHint}`);
      return;
    }

    try {
      // ── OS domain ────────────────────────────────────────────────────
      if (domain === "os") {
        const { allocateMemory, freeMemory, memory } = osStore;

        if (action === "ALLOC") {
          const size = Number(parts[1]);
          const name = parts[2] || `P${(memory?.blocks?.length || 0) + 1}`;
          if (!parts[1] || isNaN(size) || size <= 0) {
            addCommand(raw, "Usage: ALLOC [size_mb] [name]   e.g.  ALLOC 256 MyProcess");
            return;
          }
          const res = await allocateMemory?.(size, name);
          addCommand(raw, res?.success ? `Memory allocated: ${size} MB → ${name}` : res?.error || "Allocation failed.");
        }
        else if (action === "FREE") {
          if (!parts[1]) { addCommand(raw, "Usage: FREE [name]   e.g.  FREE MyProcess"); return; }
          const res = await freeMemory?.(parts[1]);
          addCommand(raw, res?.success ? `Freed block ${parts[1]}` : res?.error || "Free failed.");
        }
        else {
          addCommand(raw, `Unknown command. Type HELP for a list of available commands for this topic.`);
        }
        return;
      }

      // ── DBMS domain ──────────────────────────────────────────────────
      const { updateBTree, searchKey, executeDatabaseCommand } = dbmsStore;

      if (action === "INSERT") {
        const val = parseInt(parts[1]);
        if (isNaN(val)) { addCommand(raw, "Usage: INSERT [number]   e.g.  INSERT 42"); return; }
        const res = await updateBTree?.(val);
        addCommand(raw, res?.success
          ? `Inserted key ${val}${res.didSplit ? " — node split triggered!" : ""}`
          : "Insert failed.");
      }
      else if (action === "SELECT") {
        const val = parseInt(parts[1]);
        if (isNaN(val)) { addCommand(raw, "Usage: SELECT [number]   e.g.  SELECT 42"); return; }
        const res = await searchKey?.(val);
        addCommand(raw, res?.success ? `Searching for key ${val}…` : "Key not found.");
      }
      else if (["CREATE", "USE", "DROP"].includes(action)) {
        const res = await executeDatabaseCommand?.(raw);
        addCommand(raw, res?.success ? "Command executed." : res?.error || "Execution failed.");
      }
      else {
        addCommand(raw, "Unknown command. Type HELP for a list of available commands for this topic.");
      }
    } catch (err) {
      console.error("Terminal error:", err);
      addCommand(raw, "System error — check console for details.");
    }
  };

  const placeholder = isMemory
    ? "ALLOC [size] [name]  |  FREE [name]  |  HELP"
    : isBtree
    ? "INSERT [key]  |  SELECT [key]  |  HELP"
    : "CREATE DATABASE [name]  |  USE [name]  |  CREATE TABLE [name]  |  HELP";

  return (
    <div className="terminal-wrapper">
      <div className="terminal-header-bar">
        <span className="terminal-dot red" />
        <span className="terminal-dot yellow" />
        <span className="terminal-dot green" />
        <span className="terminal-title">conqueror@{domain}-sim</span>
      </div>

      <div className="terminal-output">
        {commandHistory.length === 0 && (
          <motion.div className="terminal-welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="tw-arrow">›</span> Type <code>HELP</code> to see available commands for this topic.
          </motion.div>
        )}
        {commandHistory.map((item, i) => (
          <div key={i} className="terminal-line">
            <div className="terminal-cmd-row">
              <span className="prompt">conqueror@root:~$</span>
              <span className="cmd-text">{item.cmd}</span>
            </div>
            <div className={`output-text ${item.output?.includes("failed") || item.output?.includes("not found") || item.output?.includes("Unknown") ? "output-error" : item.output?.includes("allocated") || item.output?.includes("Inserted") || item.output?.includes("GOAL") || item.output?.includes("executed") ? "output-success" : ""}`}>
              {item.output?.split("\n").map((line, j) => <div key={j}>{line}</div>)}
            </div>
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      <div className="input-line">
        <span className="prompt">conqueror@root:~$</span>
        <input
          autoFocus autoComplete="off" spellCheck="false"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default Terminal;
