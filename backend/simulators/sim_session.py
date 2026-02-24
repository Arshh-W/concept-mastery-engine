"""

Logic to tie together MemorySimulator / DBMSSimulator + PIDController into one
stateful object that we'll sterialize into json for DB and payload to the frontend.
"""

import copy
from typing import Any, Dict, Optional

from simulators.memory_simulator import MemorySimulator, AllocationStrategy
from simulators.dbms_simulator   import DBMSSimulator
from simulators.pid_controller   import PIDController


DOMAIN_OS   = "OS"
DOMAIN_DBMS = "DBMS"


class SimSession:
    """
    Wrapping two simulators and a PID based controller for the same
    """

    def __init__(self, domain: str, initial_state: dict):
        self.domain  = domain
        self.entropy = initial_state.get("startingEntropy", 0.5)
        self.steps   = 0

        self.pid = PIDController(
            setpoint=initial_state.get("targetSuccessRate", 0.7)
        )

        #simulation for OS logic 
        self.mem_sim: Optional[MemorySimulator] = None
        if domain == DOMAIN_OS:
            strategy_str = initial_state.get("strategy", "FIRST_FIT")
            strategy     = AllocationStrategy(strategy_str)
            self.mem_sim = MemorySimulator(
                total_memory=initial_state.get("totalMemory", 1024),
                strategy=strategy,
            )
            # Apply any pre-allocated blocks
            for block in initial_state.get("pre_allocated", []):
                self.mem_sim.allocate(block["size"], process_id=block["pid"])
            # Applying any pre-freed addresses
            for addr in initial_state.get("pre_freed", []):
                self.mem_sim.free(addr)

        # simulation for DBMS logic
        self.dbms_sim: Optional[DBMSSimulator] = None
        if domain == DOMAIN_DBMS:
            self.dbms_sim = DBMSSimulator(
                total_rows=initial_state.get("totalRows", 10_000),
                btree_order=initial_state.get("btreeOrder", 4),
            )
            for key in initial_state.get("pre_inserted_keys", []):
                self.dbms_sim.insert(key)
            if initial_state.get("has_range_index", False):
                self.dbms_sim.has_range_index = True

        self._success_window: list[bool] = []

    # action dispatch funcs

    def apply_action(self, action: str, params: dict) -> dict:
        """
        Dispatch a user command.  Returns a dict for payload response including the sim state
        """
        action = action.lower().strip()
        result: dict = {}

        if self.domain == DOMAIN_OS and self.mem_sim:
            result = self._dispatch_os(action, params)
        elif self.domain == DOMAIN_DBMS and self.dbms_sim:
            result = self._dispatch_dbms(action, params)
        else:
            result = {"success": False, "error": f"Unknown domain '{self.domain}'"}

        # Track rolling success window for PID
        self._success_window.append(bool(result.get("success", False)))
        if len(self._success_window) > 10:
            self._success_window.pop(0)

        # PID entropy/randomness control logic
        if self._success_window:
            perf = sum(self._success_window) / len(self._success_window)
            delta = self.pid.update(perf)
            self.entropy = max(0.0, min(1.0, self.entropy + delta))

        self.steps += 1
        return {
            "success":   result.get("success", False),
            "result":    result,
            "sim_state": self.get_state(),
            "entropy":   round(self.entropy, 4),
            "step":      self.steps,
        }

    def _dispatch_os(self, action: str, params: dict) -> dict:
        if action in ("alloc", "allocate"):
            size = params.get("size")
            pid  = params.get("pid")
            if not size:
                return {"success": False, "error": "Missing 'size' parameter"}
            return self.mem_sim.allocate(int(size), process_id=pid)

        if action in ("free", "dealloc", "deallocate"):
            addr = params.get("address")
            if addr is None:
                return {"success": False, "error": "Missing 'address' parameter"}
            return self.mem_sim.free(int(addr))

        if action == "compact":
            return self.mem_sim.compact()

        if action == "analyze":
            return {"success": True, **self.mem_sim.analyze()}

        return {"success": False, "error": f"Unknown OS action '{action}'"}

    def _dispatch_dbms(self, action: str, params: dict) -> dict:
        if action == "insert":
            key = params.get("key")
            if key is None:
                return {"success": False, "error": "Missing 'key' parameter"}
            return self.dbms_sim.insert(int(key))

        if action == "delete":
            key = params.get("key")
            if key is None:
                return {"success": False, "error": "Missing 'key' parameter"}
            return self.dbms_sim.delete(int(key))

        if action in ("query", "query_with_index"):
            sel = params.get("selectivity", 0.1)
            return self.dbms_sim.query_with_index(float(sel))

        if action == "query_without_index":
            sel = params.get("selectivity", 0.5)
            return self.dbms_sim.query_without_index(float(sel))

        if action == "range_query":
            start = params.get("startKey", 0)
            end   = params.get("endKey", 1000)
            idx   = params.get("useIndex", False)
            return self.dbms_sim.range_query(int(start), int(end), bool(idx))

        if action == "create_index":
            itype = params.get("type", "primary")
            return self.dbms_sim.create_index(itype)

        if action == "analyze":
            return {"success": True, **self.dbms_sim.analyze()}

        return {"success": False, "error": f"Unknown DBMS action '{action}'"}

    # serialization /state for exporting to DB

    def get_state(self) -> dict:
        state: dict = {"domain": self.domain, "entropy": self.entropy, "steps": self.steps}
        if self.mem_sim:
            state["memory"] = self.mem_sim.get_state()
        if self.dbms_sim:
            state["dbms"] = self.dbms_sim.get_state()
        return state

    def to_dict(self) -> dict:
        """Serialise full session state for DB storage."""
        d = self.get_state()
        d["_pid_integral"]  = self.pid._integral
        d["_pid_last_error"]= self.pid._last_error
        d["_success_window"]= self._success_window
        return d

    @classmethod
    def from_dict(cls, data: dict, initial_state: dict) -> "SimSession":
        #Rehydrate a session from the JSON state stored in the DB
        obj = cls.__new__(cls)
        obj.domain   = data["domain"]
        obj.entropy  = data.get("entropy", 0.5)
        obj.steps    = data.get("steps", 0)
        obj._success_window = data.get("_success_window", [])

        obj.pid = PIDController(setpoint=initial_state.get("targetSuccessRate", 0.7))
        obj.pid._integral   = data.get("_pid_integral", 0.0)
        obj.pid._last_error = data.get("_pid_last_error", 0.0)

        obj.mem_sim  = None
        obj.dbms_sim = None

        if obj.domain == DOMAIN_OS and "memory" in data:
            mem = data["memory"]
            strategy = AllocationStrategy(mem.get("strategy", "FIRST_FIT"))
            obj.mem_sim = MemorySimulator(mem["totalMemory"], strategy)
            # Rebuilding blocks from stored state
            from simulators.memory_simulator import MemoryBlock
            obj.mem_sim.blocks = [
                MemoryBlock(
                    start_address=b["startAddress"],
                    size=b["size"],
                    is_allocated=b["isAllocated"],
                    process_id=b["processId"],
                )
                for b in mem.get("blocks", [])
            ]
            obj.mem_sim.compaction_count = mem.get("compactionCount", 0)

        if obj.domain == DOMAIN_DBMS and "dbms" in data:
            d = data["dbms"]
            obj.dbms_sim = DBMSSimulator(
                total_rows=d.get("totalRows", 10_000),
                btree_order=d.get("btree", {}).get("order", 4),
            )
            obj.dbms_sim.btree.keys         = d.get("btree", {}).get("keys", [])
            obj.dbms_sim.has_primary_index  = d.get("hasPrimaryIndex", True)
            obj.dbms_sim.has_range_index    = d.get("hasRangeIndex", False)
            obj.dbms_sim.node_accesses      = d.get("totalNodeAccesses", 0)

        return obj