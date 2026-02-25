import React from "react";
import useGameStore from "../store/useGameStore";

const generateColor = (index) => {
  const colors = [
    "#ff6b6b", "#feca57", "#48dbfb", "#1dd1a1", "#5f27cd", "#ff9ff3", "#00d2d3"
  ];
  return colors[index % colors.length];
};

const MemoryMap = () => {
  const { memory } = useGameStore();

  // 1. GUARD CLAUSE: If memory is undefined (due to backend error), 
  // show a fallback UI instead of crashing.
  if (!memory || !memory.blocks) {
    return (
      <div style={{ padding: "20px", color: "#777" }}>
        <h1>Memory Map</h1>
        <p>Waiting for memory data... (Check backend connection)</p>
      </div>
    );
  }

  // 2. SAFE CALCULATIONS: Using default values to prevent NaN
  const total = memory.total || 1; // Prevent division by zero
  const heapUsed = memory.heapUsed || 0;
  const usagePercent = (heapUsed / total) * 100;
  const freeMemory = total - heapUsed;

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1 style={{ marginBottom: "10px" }}>Memory Map</h1>

      <div style={{ fontSize: "18px", marginBottom: "5px" }}>
        Total Memory: <strong>{total} MB</strong>
      </div>

      <div style={{ fontSize: "18px", marginBottom: "20px" }}>
        Heap Used: <strong>{heapUsed} MB</strong>
      </div>

      {/* Main Memory Bar */}
      <div style={{ marginBottom: "10px" }}>
        <div
          style={{
            width: "100%",
            height: "60px",
            background: "#111",
            borderRadius: "16px",
            overflow: "hidden",
            display: "flex",
            border: "1px solid #333",
            boxShadow: "0 0 20px rgba(255,140,0,0.2)"
          }}
        >
          {memory.blocks.map((block, index) => (
            <div
              key={block.id}
              style={{
                width: `${(block.size / total) * 100}%`,
                background: generateColor(index),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                color: "#000",
                transition: "all 0.3s ease",
                flexShrink: 0
              }}
            >
              {block.name}
            </div>
          ))}

          {usagePercent < 100 && (
            <div
              style={{
                width: `${100 - usagePercent}%`,
                background: "#1a1a1a",
                flexShrink: 0
              }}
            />
          )}
        </div>
        
        <div style={{ marginTop: "8px", color: "#aaa", fontSize: "12px" }}>
          Free Memory: {freeMemory} MB
        </div>
      </div>

      <div style={{ marginTop: "40px" }}>
        <h3 style={{ marginBottom: "15px" }}>Allocated Blocks</h3>

        {memory.blocks.length === 0 && (
          <p style={{ color: "#777" }}>No allocations</p>
        )}

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          width: "100%"
        }}>
          {memory.blocks.map((block, index) => (
            <div
              key={block.id}
              style={{
                padding: "10px 15px",
                borderRadius: "10px",
                background: "#1a1a1a",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "180px", 
                flex: "0 0 auto", 
                border: "1px solid #333",
                boxShadow: "2px 2px 8px rgba(0,0,0,0.5)"
              }}
            >
              <span style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginRight: "10px",
                fontSize: "14px"
              }}>
                <strong>{block.name}</strong> — {block.size}MB
              </span>

              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: generateColor(index),
                  boxShadow: `0 0 8px ${generateColor(index)}`
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemoryMap;