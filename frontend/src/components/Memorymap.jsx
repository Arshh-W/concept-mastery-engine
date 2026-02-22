import React from "react";

const MemoryMap = () => {
    return (
        <div className="memory-map">
            <h2>Memory Map</h2>
            <p>This is a visual representation of the memory layout for the current module.</p>
            <div className="memory-sections">
                <div className="memory-section">
                    <h3>Code Segment</h3>
                    <p>Contains the executable code of the program.</p>
                </div>
                <div className="memory-section">
                    <h3>Data Segment</h3>
                    <p>Contains global and static variables.</p>
                </div>
                <div className="memory-section">    
                    <h3>Heap</h3>
                    <p>Used for dynamic memory allocation.</p>
                </div>
                <div className="memory-section">
                    <h3>Stack</h3>
                    <p>Used for function call management and local variables.</p>
                </div>
            </div>
        </div>
    );
}