import React from "react";
import { useParams } from "react-router-dom"; 
import Navbar from "../components/navbar";
import Terminal from "../components/Terminal";
import MemoryMap from "../components/Memorymap";
import BTreeVisualizer from "../components/BTreeVisualizer";
import TableInspector from "../components/TableInspector";
import EventLog from "../components/Eventlog";
import GoalPanel from "../components/Goalpanel";
import "./Gameshell.css";
import XPHud from "../components/XPHud";
import HintPanel from "../components/HintPanel";
import useGameStore from "../store/useGameStore";   // DBMS — holds sessionId
import useProgressStore from "../store/useProgressStore";

export default function GameShell() {
  const { domain, module } = useParams();

  // Pull the live session token so HintPanel can query the adaptive engine
  const sessionId = useGameStore((s) => s.sessionId);

  return (
    <>
      <Navbar />
      <XPHud />

      <div className="game-container">
        <div className="left-panel">
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
        </div>

        <div className="right-panel">
          <GoalPanel />
          {/* Pass live session token so hints are tied to actual session event log */}
          <HintPanel sessionToken={sessionId} challengeSlug={module} />
          <EventLog />
        </div>

        <div className="bottom-panel">
          <Terminal />
        </div>
      </div>
    </>
  );
}
