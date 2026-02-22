import React, { useState } from "react";

export default function Terminal({ onCommand }) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (!input.trim()) return;

      
      setHistory((prev) => [...prev, input]);

      
      if (onCommand) {
        onCommand(input);
      }

      
      setInput("");
    }
  };

  return (
    <div style={{ padding: "10px", fontFamily: "monospace", color: "lime" }}>
      
      {history.map((cmd, index) => (
        <div key={index}>$ {cmd}</div>
      ))}

      
      <div>
        ${" "}
        <input
          style={{
            background: "black",
            border: "none",
            outline: "none",
            color: "lime",
            width: "90%",
            fontFamily: "monospace",
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      </div>
    </div>
  );
}