import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import './BTreeVisualizer.css';

const BTreeVisualizer = () => {
  const { 
    bTreeData, 
    highlightedNodes = [], 
    selectedNode, 
    setSelectedNode 
  } = useGameStore();

  const [hoveredNode, setHoveredNode] = useState(null);

  const NODE_HEIGHT = 45; 
  const LEVEL_HEIGHT = 100;

  const renderTree = (node, x, y, width) => {
    if (!node) return null;

    // DYNAMIC WIDTH: Calculate based on text length
    const label = node.name || (node.values && node.values.join(', ')) || "Empty";
    const dynamicWidth = Math.max(90, label.length * 9 + 20);

    return (
      <g key={node.id}>
        {/* Render Lines */}
        {node.children && node.children.map((child, i) => {
          const childWidth = width / node.children.length;
          const childX = x - width / 2 + (i + 0.5) * childWidth;
          const childY = y + LEVEL_HEIGHT;

          return (
            <line
              key={`line-${child.id}-${i}`}
              x1={x}
              y1={y + NODE_HEIGHT / 2}
              x2={childX}
              y2={childY}
              className="tree-line"
            />
          );
        })}

        {/* Node Group */}
        <motion.g 
          whileHover={{ scale: 1.05 }}
          onHoverStart={() => setHoveredNode({ ...node, x, y })}
          onHoverEnd={() => setHoveredNode(null)}
          onClick={() => setSelectedNode(node)}
          className="clickable-node"
        >
          <rect
            x={x - dynamicWidth / 2} 
            y={y}
            width={dynamicWidth} 
            height={NODE_HEIGHT}
            rx="10"
            className={`node-rect 
              ${selectedNode?.id === node.id ? 'active-db' : ''} 
              ${highlightedNodes.includes(node.id) ? 'highlighted' : ''}`}
          />
          <text x={x} y={y + 28} className="node-label" textAnchor="middle">
            {label}
          </text>
        </motion.g>

        {/* Recursion */}
        {node.children && node.children.map((child, i) => {
          const childWidth = width / node.children.length;
          const childX = x - width / 2 + (i + 0.5) * childWidth;
          return renderTree(child, childX, y + LEVEL_HEIGHT, childWidth);
        })}
      </g>
    );
  };

  return (
    <div className="btree-visualizer-wrapper">
      <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {bTreeData ? (
          <g transform="translate(0, 40)">
            {renderTree(bTreeData, 400, 20, 700)}
          </g>
        ) : (
          <text x="400" y="300" textAnchor="middle" className="empty-msg">
            SYSTEM_ERROR: NO_INDEX_FOUND
          </text>
        )}
      </svg>

      {/* --- FLOATING METADATA TOOLTIP --- */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="metadata-tooltip"
            style={{ 
              left: `${(hoveredNode.x / 800) * 100}%`, 
              top: `${(hoveredNode.y / 600) * 100}%`,
            }}
          >
            <div className="tooltip-tag">SYSTEM_INFO</div>
            <div className="tooltip-content">
              <div className="tooltip-row"><span>ID:</span> {hoveredNode.id.toString().substring(0, 6)}</div>
              <div className="tooltip-row"><span>TYPE:</span> {hoveredNode.type || 'DATA_LEAF'}</div>
              <div className="tooltip-row"><span>KEYS:</span> [{hoveredNode.values?.join(', ')}]</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BTreeVisualizer;