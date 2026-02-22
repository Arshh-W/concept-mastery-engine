import React from "react";
const EventLog = () => {
    return (
        <div className="event-log">
            <h2>Event Log</h2>
            <p>This log captures significant events and actions taken during the game.</p>
            <ul>    
                <li>Player started the game.</li>
                <li>Player completed the first level.</li>
                <li>Player unlocked a new ability.</li>
                <li>Player defeated the first boss.</li>
            </ul>
        </div>
    );
}