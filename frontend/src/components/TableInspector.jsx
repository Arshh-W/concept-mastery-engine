import React from 'react';
import useGameStore from '../store/useGameStore';
import { motion, AnimatePresence } from 'framer-motion';

const TableInspector = () => {
    const { selectedNode, dbSchema, activeTable } = useGameStore();

    // FIND: The live database object from the schema
    // Added fallback to find the activeTable database if selectedNode is null
    const targetName = selectedNode?.name || activeTable?.dbName;
    
    const liveNode = targetName 
        ? dbSchema.children.find(db => 
            db.name && db.name.toUpperCase() === targetName.toUpperCase()
          ) 
        : null;
    
    // UI: Placeholder when no database is in focus
    if (!liveNode || liveNode.type !== 'database') {
        return (
            <div className="inspector-placeholder">
                <div className="radar-icon">📡</div>
                <p>NO ACTIVE DATABASE SELECTED</p>
                <span>Execute 'USE [database_name]' or 'CREATE DATABASE'</span>
            </div>
        );
    }

    return (
        <motion.div 
            className="table-inspector"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
        >
            <div className="inspector-header">
                <div className="header-title">
                    <span className="protocol-text">DB_INSPECTOR_V1.2</span>
                    <h3>📂 {liveNode.name}</h3>
                </div>
                <span className="count-badge">
                    {liveNode.tables?.length || 0} Tables
                </span>
            </div>

            <div className="inspector-body">
                <AnimatePresence mode="popLayout">
                    {liveNode.tables?.map((table, i) => {
                        // Check if this specific table is the one receiving INSERTS
                        const isActive = 
                            activeTable?.dbName?.toUpperCase() === liveNode.name.toUpperCase() &&
                            activeTable?.tableName?.toUpperCase() === table.name.toUpperCase();

                        return (
                            <motion.div 
                                key={`${liveNode.name}-${table.name}`} 
                                className={`table-entry ${isActive ? 'active-target' : ''}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div className="table-meta">
                                    <div className="name-group">
                                        {isActive && (
                                            <motion.span 
                                                animate={{ opacity: [1, 0.4, 1] }}
                                                transition={{ repeat: Infinity, duration: 1.5 }}
                                                className="writing-indicator"
                                            >
                                                ●
                                            </motion.span>
                                        )}
                                        <strong>{table.name}</strong>
                                    </div>
                                    <div className="row-counter">
                                        <span className="label">ROWS:</span>
                                        <motion.span 
                                            key={table.rows} 
                                            initial={{ scale: 1.5, color: "#00ffcc" }}
                                            animate={{ scale: 1, color: "#fff" }}
                                            className="row-val"
                                        >
                                            {table.rows}
                                        </motion.span>
                                    </div>
                                </div>

                                <div className="column-pills">
                                    {table.columns?.map(col => (
                                        <span key={col} className="col-pill">
                                            {col}
                                        </span>
                                    ))}
                                </div>

                                {isActive && (
                                    <div className="live-status">I/O_STREAM_ACTIVE</div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                
                {(!liveNode.tables || liveNode.tables.length === 0) && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="empty-db-note"
                    >
                        Database is empty. <br/>
                        <code style={{color: '#aaa'}}>CREATE TABLE [name]</code>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default TableInspector;