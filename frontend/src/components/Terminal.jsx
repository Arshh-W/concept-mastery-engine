import React from 'react';

const Terminal = () => {
    return (
        <div className="terminal">
            <h2>Terminal</h2>
            <p>Welcome to the Code Conquer Terminal. Here you can execute commands and see your progress.</p>
            <div className="terminal-output">
                <p><span className="command"> </span>Welcome to Code Conquer!</p>
                <p><span className="command"> </span>Type 'help' to see available commands.</p>
            </div>
            <input type="text" className="terminal-input" placeholder="Enter command..." />
        </div>
    );
}