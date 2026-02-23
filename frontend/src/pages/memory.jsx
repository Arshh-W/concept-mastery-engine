import React from "react";
import Navbar from "../components/navbar";
import Terminal from "../components/Terminal";
import MemoryMap from "../components/Memorymap";
import EventLog from "../components/Eventlog";
import GoalPanel from "../components/Goalpanel";
import "./Gameshell.css";

export default function Memory() {
  return (
    <>
      <Navbar />

      <div className="game-container">
       
        <div className="left-panel">
          <MemoryMap />
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