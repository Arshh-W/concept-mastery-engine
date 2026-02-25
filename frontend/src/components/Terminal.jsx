import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useGameStore from '../store/useGameStore';
import './Terminal.css';

const VALID_COMMANDS = ['alloc', 'free', 'compact', 'SELECT', 'INSERT', 'help', 'clear'];

const Terminal = () => {
    const { domain } = useParams();
    const [input, setInput] = useState('');
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // Destructure the new actions from the store
    const { 
        commandHistory = [], 
        addCommand, 
        logEvent, 
        updateBTree, 
        searchKey, 
        completeGoal, 
        clearHistory,
        memory,
        allocateMemory, // From updated Store
        freeMemory,     // From updated Store
        syncMemory      // From updated Store
    } = useGameStore();
    
    const terminalEndRef = useRef(null);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [commandHistory]);

    // Sync memory state when switching to OS domain
    useEffect(() => {
        if (domain === 'os') {
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
        const action = parts[0];
        const value = parts[1];
        const cmd = action.toUpperCase();

        if (cmd === 'CLEAR') {
            clearHistory();
            setInput('');
            setHistoryIndex(-1);
            return;
        }

        // --- DBMS DOMAIN ---
        if (domain === 'dbms') {
            if (cmd === 'INSERT') {
                if (!isNaN(value)) {
                    await updateBTree(value);
                    addCommand(trimmedInput, `SUCCESS: Key ${value} added to B-Tree.`);
                } else {
                    addCommand(trimmedInput, "ERROR: INSERT requires a numeric key.");
                }
            } 
            else if (cmd === 'SELECT') {
                if (!isNaN(value)) {
                    await searchKey(value);
                    addCommand(trimmedInput, `Search completed for Key ${value}.`);
                } else {
                    addCommand(trimmedInput, "ERROR: SELECT requires a numeric key.");
                }
            } 
        }

        // --- OS DOMAIN (Cleaned up to use Store actions) ---
        else if (domain === 'os') {
            if (cmd === 'ALLOC') {
                const size = parseInt(value);
                const name = parts[2] || `P${memory.blocks.length + 1}`;

                if (!isNaN(size)) {
                    const result = await allocateMemory(size, name);
                    if (result.success) {
                        addCommand(trimmedInput, `Allocated ${size}MB successfully.`);
                    } else {
                        addCommand(trimmedInput, `ERROR: ${result.error}`);
                    }
                } else {
                    addCommand(trimmedInput, "ERROR: alloc requires a numeric value.");
                }
            }

            else if (cmd === 'FREE') {
                if (value) {
                    const result = await freeMemory(value);
                    if (result.success) {
                        addCommand(trimmedInput, `Freed memory block ${value}.`);
                    } else {
                        addCommand(trimmedInput, `ERROR: ${result.error}`);
                    }
                } else {
                    addCommand(trimmedInput, "ERROR: Provide a block name.");
                }
            }
            else {
                addCommand(trimmedInput, `Unknown OS command: ${cmd}`);
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
                    placeholder={`Type ${domain === 'dbms' ? 'INSERT [val]' : 'alloc [val] [name]'}...`}
                />
            </div>
        </div>
    );
};

export default Terminal;