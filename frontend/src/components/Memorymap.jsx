import React from "react";
import useGameStore from "../store/useGameStore";

const MemoryMap = () => {
  const { memory } = useGameStore();

  const usagePercent = (memory.heapUsed / memory.total) * 100;

  return (
    <div>
      <h2>Memory Map</h2>

      <p>Total Memory: {memory.total} MB</p>
      <p>Heap Used: {memory.heapUsed} MB</p>

      
      <div style={{
        width: "100%",
        height: "30px",
        background: "#222",
        borderRadius: "8px",
        overflow: "hidden",
        marginTop: "10px"
      }}>
        <div style={{
          width: `${usagePercent}%`,
          height: "100%",
          background: "linear-gradient(90deg, orange, red)",
          transition: "width 0.4s ease"
        }} />
      </div>

      
      <div style={{ marginTop: "15px" }}>
        <h4>Allocated Blocks:</h4>
        {memory.blocks.length === 0 && <p>No allocations</p>}

        {memory.blocks.map(block => (
          <div key={block.id}>
            Block: {block.size} MB
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryMap;