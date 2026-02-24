import React from "react";
import useGameStore from "../store/useGameStore";

const generateColor = (index) => {
  const colors = [
    "#ff6b6b",
    "#feca57",
    "#48dbfb",
    "#1dd1a1",
    "#5f27cd",
    "#ff9ff3",
    "#00d2d3"
  ];
  return colors[index % colors.length];
};

const MemoryMap = () => {
  const { memory } = useGameStore();

  const usagePercent = (memory.heapUsed / memory.total) * 100;
  const freeMemory = memory.total - memory.heapUsed;

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "10px" }}>Memory Map</h1>

      <div style={{ fontSize: "18px", marginBottom: "5px" }}>
        Total Memory: <strong>{memory.total} MB</strong>
      </div>

      <div style={{ fontSize: "18px", marginBottom: "20px" }}>
        Heap Used: <strong>{memory.heapUsed} MB</strong>
      </div>

      <div
        style={{
          width: "90%",
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
              width: `${(block.size / memory.total) * 100}%`,
              background: generateColor(index),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              color: "#000",
              transition: "all 0.3s ease"
            }}
          >
            {block.name}
          </div>
        ))}

        {usagePercent < 100 && (
          <div
            style={{
              width: `${100 - usagePercent}%`,
              background: "#1a1a1a"
            }}
          />
        )}
      </div>

      <div style={{ marginTop: "10px", color: "#aaa" }}>
        Free Memory: {freeMemory} MB
      </div>

      <div style={{ marginTop: "25px" }}>
        <h3>Allocated Blocks</h3>

        {memory.blocks.length === 0 && (
          <p style={{ color: "#777" }}>No allocations</p>
        )}

        {memory.blocks.map((block, index) => (
          <div
            key={block.id}
            style={{
              padding: "10px 15px",
              marginTop: "10px",
              borderRadius: "10px",
              background: "#1a1a1a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>
              <strong>{block.name}</strong> — {block.size} MB
            </span>

            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "4px",
                background: generateColor(index)
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryMap;