#ifndef DBMS_SIMULATOR_H
#define DBMS_SIMULATOR_H

#include <string>
#include <vector>
#include <json/json.h>
#include <cmath>
#include <algorithm>

/*
  DBMSSimulator.h - Database Management System Query Optimizer Simulation
  
  Simulates B-Tree operations and does the query cost estimation.
  Allows the users to see how indexing decisions affect query performance.
 */

struct BTreeNode {
    std::vector<int> keys;       // Sorted keys in node
    std::vector<BTreeNode*> children;  // Child pointers (null for leaf nodes)
    bool isLeaf;
    int order;                   // B-Tree order 
    int accessCost;              // I/O cost to access this node
    
    BTreeNode(int ord, bool leaf = true) 
        : isLeaf(leaf), order(ord), accessCost(1) {}
    
    int getKeyCount() const { return keys.size(); }
    int getMaxKeys() const { return 2 * order - 1; }
};

struct QueryPlan {
    std::string operation;       //eg. "FULL_SCAN", "INDEX_LOOKUP", "INDEX_RANGE_SCAN"
    int estimatedCost;           
    int actualRowsScanned;       
    float selectivity;           
    std::vector<std::string> usedIndexes;
};

class DBMSSimulator : public EventListener {
private:
    BTreeNode* root;
    int treeOrder;               // B-Tree order
    int nodeAccessCount;         // Total node accesses
    int totalRows;               // Total rows in table
    float queryOptimizationScore;
    
    int estimateFullTableScan() {
        // Rough estimate
        return std::max(1, (int)log2(totalRows) + 1);
    }
    
    int estimateIndexLookup(float selectivity) {
        // Estimating the lookup cost based on our B-Tree Traversal and selectivity
        int traversalCost = (int)log(totalRows) / (int)log(treeOrder) + 1;
        int dataFetchCost = (int)(totalRows * selectivity);
        return traversalCost + std::max(1, dataFetchCost / 100);
    }
    
public:
    DBMSSimulator(int order = 4, int rows = 10000)
        : treeOrder(order), nodeAccessCount(0), totalRows(rows),
          queryOptimizationScore(0.0f) {
        // Initialize simple B-tree root (leaf)
        root = new BTreeNode(order, true);
        // Add some sample keys
        for (int i = 0; i < std::min(5, rows); i += 1000) {
            root->keys.push_back(i);
        }
    }
    
    ~DBMSSimulator() {
        // Simple cleanup 
        if (root) delete root;
    }
    
    //stimulating an insert operation on the B-Tree
    bool insertKey(int key) {
        bool success = true;
        // Simplified insertion: just track access cost
        nodeAccessCount += 2; // Root access + potential rebalancing access
        
        // Simulate rebalancing by splitting nodes
        if (root->getKeyCount() >= root->getMaxKeys()) {
            // Node is full, would need split
            nodeAccessCount += 1;
        }
        
        if (std::find(root->keys.begin(), root->keys.end(), key) == root->keys.end()) {
            root->keys.push_back(key);
            std::sort(root->keys.begin(), root->keys.end());
        }
        
        return success;
    }
    
   //stimulating delete operation on the B-Tree
    bool deleteKey(int key) {
        auto it = std::find(root->keys.begin(), root->keys.end(), key);
        if (it != root->keys.end()) {
            root->keys.erase(it);
            nodeAccessCount += 2; // Access + potential rebalancing
            return true;
        }
        nodeAccessCount += 1;
        return false;
    }
    
    //generation a query plan based on whether an index is available
    QueryPlan optimizeQuery(bool hasIndex, float selectivity = 0.1f) {
        QueryPlan plan;
        plan.selectivity = selectivity;
        
        if (hasIndex) {
            plan.operation = "INDEX_LOOKUP";
            plan.estimatedCost = estimateIndexLookup(selectivity);
            plan.usedIndexes.push_back("Primary_Index");
            queryOptimizationScore += 0.1f;
        } else {
            plan.operation = "FULL_SCAN";
            plan.estimatedCost = estimateFullTableScan();
        }
        
        plan.actualRowsScanned = (int)(totalRows * selectivity);
        nodeAccessCount += plan.estimatedCost;
        
        return plan;
    }
    
    //stimulating a query execution with an index ranged scan
    void rebalanceTree() {
        // Simplified rebalancing: traverse tree and adjust structure
        nodeAccessCount += (int)log(totalRows) / (int)log(treeOrder) + 1;
    }
    
    //stimulating a range query with or without a ranged index and figuring cost
    QueryPlan rangeQuery(int startKey, int endKey, bool hasRangeIndex) {
        QueryPlan plan;
        plan.selectivity = std::min(1.0f, static_cast<float>(endKey - startKey) / totalRows);
        
        if (hasRangeIndex) {
            plan.operation = "INDEX_RANGE_SCAN";
            plan.estimatedCost = (int)log(totalRows) / (int)log(treeOrder) + abs(endKey - startKey) / 1000;
            plan.usedIndexes.push_back("Range_Index");
        } else {
            plan.operation = "FULL_TABLE_RANGE_SCAN";
            plan.estimatedCost = estimateFullTableScan();
        }
        
        plan.actualRowsScanned = abs(endKey - startKey);
        nodeAccessCount += plan.estimatedCost;
        
        return plan;
    }
    
    // EventListener implementation
    void handleEvent(const Event& event) override {
        // for responding to DBMS-specific events
        if (event.type == EventType::QUERY_EXECUTION_START) {
            nodeAccessCount = 0;
        }
    }
    
    // telemetry queries for state of B-Tree
    int getNodeAccessCount() const { return nodeAccessCount; }
    int getTotalRows() const { return totalRows; }
    float getQueryOptimizationScore() const { return queryOptimizationScore; }
    
    Json::Value getStateJson() const {
        Json::Value root;
        root["treeOrder"] = treeOrder;
        root["totalRows"] = totalRows;
        root["nodeAccessCount"] = nodeAccessCount;
        root["queryOptimizationScore"] = queryOptimizationScore;
        
        Json::Value treeInfo;
        treeInfo["rootKeyCount"] = this->root->getKeyCount();
        treeInfo["maxKeysPerNode"] = this->root->getMaxKeys();
        
        Json::Value keys(Json::arrayValue);
        for (int key : this->root->keys) {
            keys.append(key);
        }
        treeInfo["rootKeys"] = keys;
        
        root["treeInfo"] = treeInfo;
        return root;
    }
};

#endif // DBMS_SIMULATOR_H