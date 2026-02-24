import React from 'react';
import { motion } from 'framer-motion';
import useGameStore from '../store/useGameStore';
import './BTreeVisualizer.css';

const BTreeVisualizer = () => {
  const { bTreeData, highlightedNodes } = useGameStore();

  const NODE_WIDTH = 100;
  const NODE_HEIGHT = 40;
  const LEVEL_HEIGHT = 100;

  const renderTree = (node, x, y, width) => {
    if (!node) return null;

    return (
      <g key={node.id}>
        {/* Render Lines to Children */}
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

        {/* Render the actual Node */}
        <motion.g
          layout
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <rect
            x={x - NODE_WIDTH / 2}
            y={y}
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
            rx="6"
            className={`node-rect ${highlightedNodes.includes(node.id) ? 'highlighted' : ''}`}
          />
          <text x={x} y={y + 25} className="node-text">
            {node.values.join(' | ')}
          </text>
        </motion.g>

        {/* Recursively render children */}
        {node.children && node.children.map((child, i) => {
          const childWidth = width / node.children.length;
          const childX = x - width / 2 + (i + 0.5) * childWidth;
          return renderTree(child, childX, y + LEVEL_HEIGHT, childWidth);
        })}
      </g>
    );
  };

  return (
    <div className="btree-container">
      <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {bTreeData ? (
          <g transform="translate(0, 50)">
            {renderTree(bTreeData, 400, 20, 700)}
          </g>
        ) : (
          <text x="400" y="250" className="empty-msg">INITIALIZING INDEX...</text>
        )}
      </svg>
    </div>
  );
};

export default BTreeVisualizer;