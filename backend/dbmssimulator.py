"""
port for DBMSSimulator.h

it will Simulate B-Tree operations and query plan cost estimation.
shows how indexing decisions affect query performance to the user.
"""

import math
from typing import List, Optional


class BTreeSimulator:
    """
    It is a Simplified B-Tree that tracks:
      - keys inserted/deleted
      - node access count (Iinput/output cost model)
      - tree height for visualisation
    """

    def __init__(self, order: int = 4):
        self.order        = order          # max children per node 
        self.keys: list   = []             # sorted list of keys in the B-Tree
        self.node_accesses = 0
        self.max_keys_per_node = order - 1

    def insert(self, key: int) -> dict:
        if key in self.keys:
            return {"success": False, "error": f"Key {key} already exists"}
        self.keys.append(key)
        self.keys.sort()
        self.node_accesses += self._tree_height() + 1 
        return {
            "success": True,
            "key": key,
            "nodeAccessCost": self._tree_height() + 1,
            "treeHeight": self._tree_height(),
        }

    def delete(self, key: int) -> dict:
        if key not in self.keys:
            return {"success": False, "error": f"Key {key} not found"}
        self.keys.remove(key)
        self.node_accesses += self._tree_height() + 1
        return {
            "success": True,
            "key": key,
            "nodeAccessCost": self._tree_height() + 1,
        }

    def _tree_height(self) -> int:
        if not self.keys:
            return 1
        return max(1, math.ceil(math.log(len(self.keys) + 1, self.order)))

    def get_state(self) -> dict:
        return {
            "keys":           self.keys[:50],   
            "keyCount":       len(self.keys),
            "treeHeight":     self._tree_height(),
            "order":          self.order,
            "nodeAccesses":   self.node_accesses,
            "maxKeysPerNode": self.max_keys_per_node,
        }


class DBMSSimulator:
    def __init__(self, total_rows: int = 10_000, btree_order: int = 4):
        self.total_rows        = total_rows
        self.btree             = BTreeSimulator(btree_order)
        self.has_primary_index = True
        self.has_range_index   = False
        self.node_accesses     = 0
        self.last_query_plan: Optional[dict] = None

    #API

    def insert(self, key: int) -> dict:
        result = self.btree.insert(key)
        self.node_accesses += result.get("nodeAccessCost", 0)
        return result

    def delete(self, key: int) -> dict:
        result = self.btree.delete(key)
        self.node_accesses += result.get("nodeAccessCost", 0)
        return result

    def query_with_index(self, selectivity: float = 0.1) -> dict:
        return self._run_query(use_index=True, selectivity=selectivity, query_type="point")

    def query_without_index(self, selectivity: float = 0.5) -> dict:
        return self._run_query(use_index=False, selectivity=selectivity, query_type="point")

    def range_query(self, start_key: int, end_key: int, use_index: bool = False) -> dict:
        selectivity = min(1.0, abs(end_key - start_key) / max(self.total_rows, 1))
        return self._run_query(use_index=use_index, selectivity=selectivity, query_type="range")

    def create_index(self, index_type: str = "primary") -> dict:
        if index_type == "range":
            self.has_range_index = True
        else:
            self.has_primary_index = True
        return {"success": True, "indexType": index_type, "message": f"{index_type} index created"}

    def analyze(self) -> dict:
        return {
            "totalRows":       self.total_rows,
            "totalNodeAccesses": self.node_accesses,
            "hasPrimaryIndex": self.has_primary_index,
            "hasRangeIndex":   self.has_range_index,
            "btree":           self.btree.get_state(),
            "lastQueryPlan":   self.last_query_plan,
        }

    def get_state(self) -> dict:
        return self.analyze()

    #internal query simulation logic

    def _run_query(self, use_index: bool, selectivity: float, query_type: str) -> dict:
        rows_scanned = int(self.total_rows * selectivity)

        if use_index and self.has_primary_index:
            height    = self.btree._tree_height()
            io_cost   = height + max(1, rows_scanned // 100)
            operation = "INDEX_RANGE_SCAN" if query_type == "range" else "INDEX_LOOKUP"
            indexes   = ["primary_index"]
        else:
            io_cost   = max(1, int(math.log2(self.total_rows + 1))) + 1
            operation = "FULL_TABLE_SCAN"
            indexes   = []

        self.node_accesses += io_cost
        plan = {
            "operation":    operation,
            "estimatedCost": io_cost,
            "rowsScanned":  rows_scanned,
            "selectivity":  round(selectivity, 4),
            "usedIndexes":  indexes,
        }
        self.last_query_plan = plan
        return {"success": True, "queryPlan": plan}