import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useGameStore from '../store/useGameStore';
import { sendQuery } from "../services/mockApi";
import './Terminal.css';

const VALID_COMMANDS = ['alloc', 'free', 'compact', 'SELECT', 'INSERT', 'help', 'clear'];

const Terminal = () => {
    const { domain } = useParams();
    const [input, setInput] = useState('');
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // Pulling all necessary actions from Zustand
    const { 
        commandHistory, addCommand, logEvent, 
        setMemoryFromBackend, updateBTree, searchKey, 
        completeGoal, updateXP, bTreeData 
    } = useGameStore();
    
    const terminalEndRef = useRef(null);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [commandHistory]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            processCommand();
        } else if (e.key === 'ArrowUp') {
            if (historyIndex < commandHistory.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setInput(commandHistory[commandHistory.length - 1 - newIndex].cmd);
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const match = VALID_COMMANDS.find(c => c.toLowerCase().startsWith(input.toLowerCase()));
            if (match) setInput(match);
        }
    };

    const processCommand = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        const [action, value] = trimmedInput.split(' ');
        const cmd = action.toUpperCase();

        // 1. Handle "Local" UI Commands
        if (cmd === 'CLEAR') {
        useGameStore.getState().clearHistory(); // Wipe the history in the store
        setInput('');
        setHistoryIndex(-1);
        return; 
    }
        // 2. Handle DBMS Domain Logic
        if (domain === 'dbms') {
            if (cmd === 'INSERT') {
                if (!isNaN(value)) {
                    await updateBTree(value);
                    logEvent(`Index update: Key ${value} inserted.`, "success");
                    addCommand(trimmedInput, `SUCCESS: Key ${value} added to B-Tree.`);
                    
                    // Check for Root Split Goal
                    if (bTreeData.children && bTreeData.children.length > 0) {
                        completeGoal(1);
                    }
                } else {
                    addCommand(trimmedInput, "ERROR: INSERT requires a numeric key.");
                }
            } 
            else if (cmd === 'SELECT') {
                if (value) {
                    logEvent(`Searching for Key: ${value}...`, "info");
                    await searchKey(value);
                    addCommand(trimmedInput, `Search completed for Key ${value}.`);
                } else {
                    addCommand(trimmedInput, "ERROR: SELECT requires a search key.");
                }
            }
            else {
                addCommand(trimmedInput, `Unknown DBMS command: ${cmd}`);
            }
        }

        // 3. Handle OS Domain Logic (API Driven)
        else if (domain === 'os') {
            const response = await sendQuery(trimmedInput);
            if (response.status === "success") {
                if (response.memory) {
                    setMemoryFromBackend(response.memory);
                }
                logEvent(response.message, "success");
                addCommand(trimmedInput, response.message);
            } else {
                logEvent(response.message, "error");
                addCommand(trimmedInput, response.message);
            }
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
                    placeholder={`Type ${domain === 'dbms' ? 'INSERT [val]' : 'alloc [val]'}...`}
                />
            </div>
        </div>
    );
};

export default Terminal;