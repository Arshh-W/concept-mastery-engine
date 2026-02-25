import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useGameStore from '../store/useGameStore';
import './Terminal.css';

// Added new valid commands for schema manipulation
const VALID_COMMANDS = [
    'alloc', 'free', 'compact', 'SELECT', 'INSERT', 
    'CREATE DATABASE', 'CREATE TABLE', 'DROP DATABASE', 'DROP TABLE', 
    'help', 'clear'
];

const Terminal = () => {
    const { domain } = useParams();
    const [input, setInput] = useState('');
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    const { 
        commandHistory = [], 
        addCommand, 
        logEvent, 
        updateBTree, 
        searchKey, 
        executeDatabaseCommand, // New Action
        clearHistory,
        memory,
        allocateMemory, 
        freeMemory,     
        syncMemory      
    } = useGameStore();
    
    const terminalEndRef = useRef(null);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [commandHistory]);

    useEffect(() => {
        if (domain === 'os' && syncMemory) {
            syncMemory();
        }
    }, [domain, syncMemory]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            processCommand();
        } else if (e.key === 'ArrowUp') {
            if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
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

        const parts = trimmedInput.split(' ');
        const action = parts[0].toUpperCase();
        const type = parts[1]?.toUpperCase();
        const value = parts[1]; 
        const name = parts[2];  

        if (action === 'CLEAR') {
            clearHistory();
            setInput('');
            setHistoryIndex(-1);
            return;
        }

        // --- DBMS DOMAIN ---
        if (domain === 'dbms') {
            //  Handle Schema Commands (CREATE/DROP)
            if (action === 'CREATE' || action === 'DROP') {
                if (!type || !parts[2]) {
                    addCommand(trimmedInput, `ERROR: ${action} requires a type (DATABASE/TABLE) and a name.`);
                } else {
                    await executeDatabaseCommand(trimmedInput);
                    addCommand(trimmedInput, `Executing ${action} ${type} operation...`);
                }
            } 
            // Handle Context Switch (USE)
            else if (action === 'USE') {
                if (!parts[1]) {
                    addCommand(trimmedInput, "ERROR: USE requires a database name.");
                } else {
                    await executeDatabaseCommand(trimmedInput); // This triggers the store logic we wrote
                    addCommand(trimmedInput, `Context switched to: ${parts[1]}`);
                }
            }
            // Handle Data Commands (INSERT)
            else if (action === 'INSERT') {
                if (!isNaN(value)) {
                    await updateBTree(value);
                    addCommand(trimmedInput, `SUCCESS: Key ${value} written to disk.`);
                } else {
                    addCommand(trimmedInput, "ERROR: INSERT requires a numeric key.");
                }
            } 
            //  Handle Search Commands (SELECT)
            else if (action === 'SELECT') {
                if (!isNaN(value)) {
                    await searchKey(value);
                    addCommand(trimmedInput, `Index Scan initiated for ID: ${value}.`);
                } else {
                    addCommand(trimmedInput, "ERROR: SELECT requires a numeric key.");
                }
            } 
            else {
                addCommand(trimmedInput, `Unknown DBMS command: ${action}`);
            }
        }
        // --- OS DOMAIN ---
        else if (domain === 'os') {
            if (action === 'ALLOC') {
                const size = parseInt(value);
                const blockName = parts[2] || `P${memory.blocks.length + 1}`;

                if (!isNaN(size)) {
                    const result = await allocateMemory(size, blockName);
                    if (result.success) {
                        addCommand(trimmedInput, `Memory Map updated: ${size}MB assigned to ${blockName}.`);
                    } else {
                        addCommand(trimmedInput, `SEGMENTATION FAULT: ${result.error}`);
                    }
                } else {
                    addCommand(trimmedInput, "ERROR: alloc requires a numeric size.");
                }
            }
            else if (action === 'FREE') {
                if (value) {
                    const result = await freeMemory(value);
                    if (result.success) {
                        addCommand(trimmedInput, `Released memory block ${value}.`);
                    } else {
                        addCommand(trimmedInput, `ERROR: Block ${value} not found.`);
                    }
                } else {
                    addCommand(trimmedInput, "ERROR: Provide a block name to free.");
                }
            }
            else {
                addCommand(trimmedInput, `Unknown Kernel command: ${action}`);
            }
        }

        setInput('');
        setHistoryIndex(-1);
    };

    return (
        <div className="terminal-wrapper">
            <div className="terminal-output">
                {commandHistory?.map((item, index) => (
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
                    autoComplete="off"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        domain === 'dbms' 
                        ? "INSERT [id] | CREATE DATABASE [name]..." 
                        : "ALLOC [size] [name] | FREE [name]..."
                    }
                />
            </div>
        </div>
    );
};

export default Terminal;