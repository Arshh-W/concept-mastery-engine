import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import useGameStore1 from "../store/use1";

const generateColor = (index) => {
  const colors = [
    "#ff6b6b",
    "#feca57",
    "#48dbfb",
    "#1dd1a1",
    "#5f27cd",
    "#ff9ff3",
    "#00d2d3",
  ];
  return colors[index % colors.length];
};

const MemoryMap = () => {
  const { memory } = useGameStore1();

  if (!memory || !memory.blocks) {
    return (
      <div style={{ padding: "20px", color: "#777" }}>
        <h1>Memory Map</h1>
        <p>Waiting for memory data... (Check backend connection)</p>
      </div>
    );
  }

  const total = memory.total || 1;
  const heapUsed = memory.heapUsed || 0;
  const usagePercent = (heapUsed / total) * 100;
  const freeMemory = total - heapUsed;

  return (
    <div style={{ padding: "20px", color: "white" }}>
      <motion.h1
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: "10px" }}
      >
        Memory Map
      </motion.h1>

      <div style={{ fontSize: "18px", marginBottom: "5px" }}>
        Total Memory: <strong>{total} MB</strong>
      </div>

      <div style={{ fontSize: "18px", marginBottom: "20px" }}>
        Heap Used: <strong>{heapUsed} MB</strong>
      </div>

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
            boxShadow: "0 0 20px rgba(255,140,0,0.2)",
          }}
        >
          <AnimatePresence>
            {memory.blocks.map((block, index) => (
              <motion.div
                key={block.id}
                layout="position"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 18,
                }}
                style={{
                  width: `${(block.size / total) * 100}%`,
                  background: generateColor(index),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  color: "#000",
                  flexShrink: 0,
                }}
              >
                {block.name}
              </motion.div>
            ))}
          </AnimatePresence>

          {usagePercent < 100 && (
            <motion.div
              layout
              style={{
                width: `${100 - usagePercent}%`,
                background: "#1a1a1a",
                flexShrink: 0,
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

        <motion.div
          layout
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            width: "100%",
          }}
        >
          <AnimatePresence>
            {memory.blocks.map((block, index) => (
              <motion.div
                key={block.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 20,
                }}
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
                  boxShadow: "2px 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginRight: "10px",
                    fontSize: "14px",
                  }}
                >
                  <strong>{block.name}</strong> — {block.size}MB
                </span>

                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: generateColor(index),
                    boxShadow: `0 0 8px ${generateColor(index)}`,
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default MemoryMap;