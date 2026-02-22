// src/pages/GameShell.jsx
import React from 'react';
import Terminal from '../components/Terminal';
import MemoryMap from '../components/Memorymap';
import GoalPanel from '../components/Goalpanel';
import EventLog from '../components/Eventlog';
import './Gameshell.css';

export default function GameShell() {
  return (
    <div className="game-container">
      <div className="side-panel left">
        <GoalPanel />
        <EventLog />
      </div>
      
      <main className="visualization-area">
        {/* Switch between MemoryMap and BTree based on route/module */}
        <MemoryMap /> 
      </main>

      <div className="bottom-panel">
        <Terminal />
      </div>
    </div>
  );
}