import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useGameStore from '../store/useGameStore';
import './Terminal.css';

const VALID_COMMANDS = ['alloc', 'free', 'compact', 'SELECT', 'INSERT', 'help', 'clear'];

const Terminal = () => {
    const { domain } = useParams();
    const [input, setInput] = useState('');
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    // Destructure with default values to prevent "undefined" crashes
    const { 
        commandHistory = [], 
        addCommand, 
        logEvent, 
        setMemoryFromBackend, 
        updateBTree, 
        searchKey, 
        completeGoal, 
        clearHistory 
    } = useGameStore();
    
    const terminalEndRef = useRef(null);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [commandHistory]);

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

        // 1. Handle CLEAR
        if (cmd === 'CLEAR') {
            clearHistory();
            setInput('');
            setHistoryIndex(-1);
            return;
        }

        // 2. Handle DBMS
        if (domain === 'dbms') {
            if (cmd === 'INSERT') {
                if (!isNaN(value)) {
                    await updateBTree(value);
                    logEvent(`Index update: Key ${value} inserted.`, "success");
                    addCommand(trimmedInput, `SUCCESS: Key ${value} added to B-Tree.`);
                    
                    const latestTree = useGameStore.getState().bTreeData;
                    if (latestTree.children && latestTree.children.length > 0) {
                        completeGoal(1);
                    }
                } else {
                    addCommand(trimmedInput, "ERROR: INSERT requires a numeric key.");
                }
            } 
            else if (cmd === 'SELECT') {
                if (!isNaN(value)) {
                    logEvent(`Searching for Key: ${value}...`, "info");
                    await searchKey(value);
                    addCommand(trimmedInput, `Search completed for Key ${value}.`);
                } else {
                    addCommand(trimmedInput, "ERROR: SELECT requires a numeric key.");
                }
            } 
            else {
                addCommand(trimmedInput, `Unknown DBMS command: ${cmd}`);
            }
        }

        // 3. Handle OS (LOCAL SIMULATION)
        else if (domain === 'os') {
            const store = useGameStore.getState();
            const currentMemory = store.memory;

            if (cmd === 'ALLOC') {
                if (!isNaN(value)) {
                    const size = parseInt(value);

                    if (currentMemory.heapUsed + size <= currentMemory.total) {
                        const newBlock = {
                            id: Date.now(),
                            size,
                            name: parts[2] || `P${currentMemory.blocks.length + 1}`
                        };

                        const updatedMemory = {
                            ...currentMemory,
                            heapUsed: currentMemory.heapUsed + size,
                            blocks: [...currentMemory.blocks, newBlock]
                        };

                        setMemoryFromBackend(updatedMemory);
                        logEvent(`Allocated ${size}MB successfully.`, "success");
                        addCommand(trimmedInput, `Allocated ${size}MB successfully.`);
                    } else {
                        addCommand(trimmedInput, "ERROR: Not enough memory.");
                    }
                } else {
                    addCommand(trimmedInput, "ERROR: alloc requires a numeric value.");
                }
            }

            else if (cmd === 'FREE') {
                const blockName = value;
                const block = currentMemory.blocks.find(b => b.name === blockName);

                if (block) {
                    const updatedMemory = {
                        ...currentMemory,
                        heapUsed: currentMemory.heapUsed - block.size,
                        blocks: currentMemory.blocks.filter(b => b.name !== blockName)
                    };

                    setMemoryFromBackend(updatedMemory);
                    logEvent(`Freed memory block ${blockName}.`, "info");
                    addCommand(trimmedInput, `Freed memory block ${blockName}.`);
                } else {
                    addCommand(trimmedInput, "ERROR: Block not found.");
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
                {/* Safe mapping with optional chaining */}
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