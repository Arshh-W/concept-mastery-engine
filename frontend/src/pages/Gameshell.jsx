import React from "react";
import { useParams } from "react-router-dom"; 
import Navbar from "../components/navbar";
import Terminal from "../components/Terminal";
import MemoryMap from "../components/Memorymap";
import BTreeVisualizer from "../components/BTreeVisualizer";
import TableInspector from "../components/TableInspector"; // New Import
import EventLog from "../components/Eventlog";
import GoalPanel from "../components/Goalpanel";
import "./Gameshell.css";

export default function GameShell() {
  const { domain, module } = useParams();

  return (
    <>
      <Navbar />

      <div className="game-container">
        <div className="left-panel">
          {/* If DBMS, we use a split layout inside the panel */}
          {domain === "dbms" ? (
            <div className="dbms-workspace">
              <div className="tree-canvas">
                <BTreeVisualizer />
              </div>
              <div className="details-sidebar">
                <TableInspector />
              </div>
            </div>
          ) : (
            <MemoryMap />
          )}
          
          <div className="module-tag">
            SYSTEM_{domain?.toUpperCase()} // MISSION_{module?.toUpperCase()}
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