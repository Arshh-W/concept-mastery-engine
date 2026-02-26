import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import useGameStore from "../store/useGameStore";     // DBMS
import useGameStore1 from "../store/use1";            // OS
import "./Terminal.css";

const VALID_COMMANDS = [
  "alloc",
  "free",
  "SELECT",
  "INSERT",
  "CREATE DATABASE",
  "CREATE TABLE",
  "DROP DATABASE",
  "DROP TABLE",
  "USE",
  "help",
  "clear",
];

const Terminal = () => {
  const { domain } = useParams();
  const [input, setInput] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const terminalEndRef = useRef(null);


  const dbmsStore = useGameStore();
  const osStore = useGameStore1();

  const activeStore = domain === "os" ? osStore : dbmsStore;

  const {
    commandHistory = [],
    addCommand,
    clearHistory,
  } = activeStore;

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [commandHistory]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") processCommand();

    if (e.key === "ArrowUp") {
      if (
        commandHistory.length > 0 &&
        historyIndex < commandHistory.length - 1
      ) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex].cmd);
      }
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const match = VALID_COMMANDS.find((c) =>
        c.toLowerCase().startsWith(input.toLowerCase())
      );
      if (match) setInput(match);
    }
  };

  const processCommand = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const parts = trimmedInput.split(" ");
    const action = parts[0].toUpperCase();
    const value = parts[1];
    const name = parts[2];

    if (action === "CLEAR") {
      clearHistory?.();
      setInput("");
      setHistoryIndex(-1);
      return;
    }

    try {
 
      if (domain === "dbms") {
        const {
          updateBTree,
          searchKey,
          executeDatabaseCommand,
        } = dbmsStore;

        if (action === "INSERT" && !isNaN(value)) {
          const result = await updateBTree?.(value);
          if (result?.success !== false) {
            addCommand(trimmedInput, `Inserted key ${value}.`);
          } else {
            addCommand(trimmedInput, "Insert failed.");
          }
        } 
        else if (action === "SELECT" && !isNaN(value)) {
          const result = await searchKey?.(value);
          if (result?.success !== false) {
            addCommand(trimmedInput, `Searching key ${value}...`);
          } else {
            addCommand(trimmedInput, "Key not found.");
          }
        }
        else if (action === "CREATE" || action === "DROP" || action === "USE") {
          const result = await executeDatabaseCommand?.(trimmedInput);
          if (result?.success !== false) {
            addCommand(trimmedInput, "Command executed.");
          } else {
            addCommand(trimmedInput, result?.error || "Execution failed.");
          }
        }
        else {
          addCommand(trimmedInput, "Unknown DBMS command.");
        }
      }


      else if (domain === "os") {
        const { allocateMemory, freeMemory, memory } = osStore;

        if (action === "ALLOC") {
          const size = Number(value);
          const blockName =
            name || `P${(memory?.blocks?.length || 0) + 1}`;

          const result = await allocateMemory?.(size, blockName);

          if (result?.success) {
            addCommand(
              trimmedInput,
              `Memory allocated: ${size}MB → ${blockName}`
            );
          } else {
            addCommand(
              trimmedInput,
              result?.error || "Allocation failed."
            );
          }
        } 
        else if (action === "FREE") {
          const result = await freeMemory?.(value);

          if (result?.success) {
            addCommand(trimmedInput, `Freed block ${value}`);
          } else {
            addCommand(
              trimmedInput,
              result?.error || "Free failed."
            );
          }
        } 
        else {
          addCommand(trimmedInput, "Unknown OS command.");
        }
      }

    } catch (error) {
      console.error("Terminal error:", error);
      addCommand(trimmedInput, "System error occurred.");
    }

    setInput("");
    setHistoryIndex(-1);
  };

  return (
    <div className="terminal-wrapper">
      <div className="terminal-output">
        {commandHistory?.map((item, index) => (
          <div key={index} className="terminal-line">
            <span className="prompt">conqueror@root:~$</span> {item.cmd}
            <div className="output-text">{item.output}</div>
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      <div className="input-line">
        <span className="prompt">conqueror@root:~$</span>
        <input
          autoFocus
          autoComplete="off"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            domain === "dbms"
              ? "INSERT [id] | CREATE DATABASE..."
              : "ALLOC [size] [name] | FREE [name]..."
          }
        />
      </div>
    </div>
  );
};

export default Terminal;