import React from "react";
import { useParams } from "react-router-dom"; 
import Navbar from "../components/navbar";
import Terminal from "../components/Terminal";
import MemoryMap from "../components/Memorymap"; // OS Visualizer
import BTreeVisualizer from "../components/BTreeVisualizer"; // DBMS Visualizer
import EventLog from "../components/Eventlog";
import GoalPanel from "../components/Goalpanel";
import "./Gameshell.css";

export default function GameShell() {
  const { domain, module } = useParams(); // domain will be 'os' or 'dbms'

  return (
    <>
      <Navbar />

      <div className="game-container">
        <div className="left-panel">
          {/* DYNAMIC VISUALIZER LOGIC:
              If domain is 'os', show MemoryMap.
              If domain is 'dbms', show BTreeVisualizer.
          */}
          {domain === "os" && <MemoryMap />}
          {domain === "dbms" && <BTreeVisualizer />}
          
          {/* Overlay for the module name */}
          <div className="module-tag">
            SYSTEM_{domain.toUpperCase()} // MISSION_{module.toUpperCase()}
          </div>
        </div>

        <div className="right-panel">
          <GoalPanel />
          <EventLog />
        </div>

        <div className="bottom-panel">
          <Terminal />
        </div>
      </div>
    </>
  );
}