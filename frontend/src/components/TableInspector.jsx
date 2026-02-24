import React from 'react';
import useGameStore from '../store/useGameStore';

const TableInspector = () => {
  const { selectedNode } = useGameStore();

  if (!selectedNode || selectedNode.type !== 'database') {
    return (
      <div className="inspector-placeholder">
        <p>SELECT A DATABASE NODE TO INSPECT SCHEMA</p>
      </div>
    );
  }

  return (
    <div className="table-inspector">
      <div className="inspector-header">
        <h3>📂 {selectedNode.name}</h3>
        <span className="count-badge">{selectedNode.tables?.length || 0} Tables</span>
      </div>
      <div className="inspector-body">
        {selectedNode.tables?.map((table, i) => (
          <div key={i} className="table-entry">
            <div className="table-meta">
              <strong>{table.name}</strong>
              <span>{table.rows} rows</span>
            </div>
            <div className="column-pills">
              {table.columns.map(col => <span key={col}>{col}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableInspector;
