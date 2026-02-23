import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../store/useGameStore';
import './Terminal.css';

const VALID_COMMANDS = ['alloc', 'free', 'compact', 'SELECT', 'INSERT', 'help', 'clear'];

const Terminal = () => {
    const [input, setInput] = useState('');
    const [historyIndex, setHistoryIndex] = useState(-1);
    const { commandHistory, addCommand, logEvent } = useGameStore();
    const terminalEndRef = useRef(null);

    // Auto-scroll to bottom on new output
    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [commandHistory]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            processCommand();
        } else if (e.key === 'ArrowUp') {
            // Navigate history up
            if (historyIndex < commandHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[commandHistory.length - 1 - newIndex].cmd);
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            // Simple Autocomplete
            const match = VALID_COMMANDS.find(c => c.toLowerCase().startsWith(input.toLowerCase()));
            if (match) setInput(match);
        }
    };

    const processCommand = () => {
        if (!input.trim()) return;

        //  Log the command locally
        addCommand(input, `Executing ${input}...`);
        
        //  Mock Logic (In reality, you'd call your api.js here)
        if (input.startsWith('alloc')) {
            logEvent("Memory allocation request sent to Kernel.", "success");
        } else if (!VALID_COMMANDS.includes(input.split(' ')[0])) {
            logEvent(`Unknown command: ${input}`, "error");
        }

        setInput('');
        setHistoryIndex(-1);
    };

    return (
        <div className="terminal-wrapper">
            <div className="terminal-output">
                {commandHistory.map((item, index) => (
                    <div key={index} className="terminal-line">
                        <span className="prompt">conqueror@root:~$</span> {item.cmd}
                        <div className="output-text">{item.output}</div>
                    </div>
                ))}
                <div ref={terminalEndRef} />
            </div>
            <div className="input-line">
                <span className="prompt">conqueror@root:~$</span>
                <input
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type command (Tab to autocomplete)..."
                />
            </div>
        </div>
    );
};

export default Terminal;