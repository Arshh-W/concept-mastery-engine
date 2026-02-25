import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import './BTreeVisualizer.css';

const BTreeVisualizer = () => {
  const bTreeData = useGameStore((state) => state.bTreeData);
  const highlightedNodes = useGameStore((state) => state.highlightedNodes) || [];
  const selectedNode = useGameStore((state) => state.selectedNode);
  const setSelectedNode = useGameStore((state) => state.setSelectedNode);

  const [hoveredNode, setHoveredNode] = useState(null);

  const NODE_HEIGHT = 45; 
  const LEVEL_HEIGHT = 100;

  const renderTree = (node, x, y, width) => {
    if (!node) return null;

    const nodeValues = Array.isArray(node.values) ? node.values : [];
    const label = node.name || (nodeValues.length > 0 ? nodeValues.join(' | ') : "EMPTY");
    
    const dynamicWidth = Math.max(90, label.length * 10 + 20);

    return (
      <g key={node.id || Math.random()}>
        {/* Render Connection Lines */}
        {node.children && node.children.map((child, i) => {
          if (!child) return null;
          const childWidth = width / node.children.length;
          const childX = x - width / 2 + (i + 0.5) * childWidth;
          const childY = y + LEVEL_HEIGHT;

          return (
            <motion.line
              key={`line-${child.id}-${i}`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              x1={x}
              y1={y + NODE_HEIGHT / 2}
              x2={childX}
              y2={childY}
              className="tree-line"
              stroke="#444"
              strokeWidth="2"
            />
          );
        })}

        {/* Node Group */}
        <motion.g 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          className="clickable-node"
          style={{ cursor: 'pointer' }}
          onHoverStart={() => setHoveredNode({ ...node, x, y })}
          onHoverEnd={() => setHoveredNode(null)}
          onClick={(e) => {
            e.stopPropagation(); // Prevent event bubbling
            if (typeof setSelectedNode === 'function') {
                setSelectedNode(node);
            }
          }}
        >
          <rect
            x={x - dynamicWidth / 2} 
            y={y}
            width={dynamicWidth} 
            height={NODE_HEIGHT}
            rx="8"
            className={`node-rect 
              ${selectedNode?.id === node.id ? 'active-db' : ''} 
              ${highlightedNodes.includes(node.id) ? 'highlighted' : ''}`}
            fill={highlightedNodes.includes(node.id) ? "#00ffcc22" : "#1a1a1a"}
            stroke={highlightedNodes.includes(node.id) ? "#00ffcc" : "#444"}
            strokeWidth={selectedNode?.id === node.id ? "3" : "1.5"}
          />
          <text 
            x={x} 
            y={y + 28} 
            className="node-label" 
            textAnchor="middle"
            fill="#fff"
            style={{ pointerEvents: 'none', fontWeight: '500', fontSize: '14px' }}
          >
            {label}
          </text>
        </motion.g>

        {/* Recursion: Render children */}
        {node.children && node.children.map((child, i) => {
          const childWidth = width / node.children.length;
          const childX = x - width / 2 + (i + 0.5) * childWidth;
          return renderTree(child, childX, y + LEVEL_HEIGHT, childWidth);
        })}
      </g>
    );
  };

  return (
    <div className="btree-visualizer-wrapper" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
        {bTreeData ? (
          <g transform="translate(0, 50)">
            {renderTree(bTreeData, 400, 20, 700)}
          </g>
        ) : (
          <text x="400" y="300" textAnchor="middle" className="empty-msg" fill="#666">
            SYSTEM_ERROR: NO_INDEX_STRUCTURE_FOUND
          </text>
        )}
      </svg>

      {/* --- FLOATING METADATA TOOLTIP --- */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="metadata-tooltip"
            style={{ 
              position: 'absolute',
              left: `${(hoveredNode.x / 800) * 100}%`, 
              top: `${(hoveredNode.y / 600) * 100 + 10}%`,
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              zIndex: 10
            }}
          >
            <div className="tooltip-tag">NODE_SCAN</div>
            <div className="tooltip-content">
              <div className="tooltip-row"><span>ID:</span> {hoveredNode.id?.toString().substring(0, 8)}</div>
              <div className="tooltip-row"><span>HEIGHT:</span> {hoveredNode.children ? 'INTERNAL' : 'LEAF'}</div>
              <div className="tooltip-row"><span>VALS:</span> [{hoveredNode.values?.join(', ')}]</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BTreeVisualizer;