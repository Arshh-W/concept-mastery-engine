"""
port for MemorySimulator.h

Simulates OS memory allocation with First-Fit, Best-Fit, Worst-Fit strategies.
Tracks the fragmentation, compaction, and produces serialisable state for the API calls.
"""

from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import List, Optional


class AllocationStrategy(str, Enum):
    FIRST_FIT = "FIRST_FIT"
    BEST_FIT  = "BEST_FIT"
    WORST_FIT = "WORST_FIT"


@dataclass
class MemoryBlock:
    start_address: int
    size: int
    is_allocated: bool = False
    process_id: int = 0

    @property
    def end_address(self) -> int:
        return self.start_address + self.size

    def to_dict(self) -> dict:
        return {
            "startAddress": self.start_address,
            "endAddress":   self.end_address,
            "size":         self.size,
            "isAllocated":  self.is_allocated,
            "processId":    self.process_id,
        }


class MemorySimulator:
    def __init__(
        self,
        total_memory: int = 1024,
        strategy: AllocationStrategy = AllocationStrategy.FIRST_FIT,
    ):
        self.total_memory = total_memory
        self.strategy     = strategy
        self.blocks: List[MemoryBlock] = [MemoryBlock(0, total_memory)]
        self.compaction_count  = 0
        self._next_default_pid = 1

    #API

    def allocate(self, size: int, process_id: Optional[int] = None) -> dict:
        #allocates a block of size kB to process_id
        if process_id is None:
            process_id = self._next_default_pid
            self._next_default_pid += 1

        if size <= 0 or size > self.total_memory:
            return {"success": False, "error": "Invalid size", "address": None}

        idx = self._find_block(size)
        if idx == -1:
            free_total = sum(b.size for b in self.blocks if not b.is_allocated)
            return {
                "success": False,
                "error": (
                    f"No contiguous block of {size}KB available. "
                    f"Total free: {free_total}KB (fragmented)."
                ),
                "address": None,
                "fragmentation_hint": free_total >= size,
            }

        block    = self.blocks[idx]
        address  = block.start_address
        leftover = block.size - size

        if leftover > 0:
            self.blocks.insert(idx + 1, MemoryBlock(address + size, leftover))

        self.blocks[idx] = MemoryBlock(address, size, is_allocated=True, process_id=process_id)
        return {"success": True, "address": address, "process_id": process_id, "size": size}

    def free(self, address: int) -> dict:
        #frees the block at the given address
        for i, block in enumerate(self.blocks):
            if block.start_address == address and block.is_allocated:
                pid = block.process_id
                self.blocks[i] = MemoryBlock(block.start_address, block.size)
                self._merge_free_blocks()
                return {"success": True, "freed_pid": pid, "address": address}
        return {"success": False, "error": f"No allocated block at address {address}"}

    def compact(self) -> dict:
        #compact memory for moving all allocated blocks to the start 
        allocated = [b for b in self.blocks if b.is_allocated]
        cursor    = 0
        new_blocks: List[MemoryBlock] = []

        for b in allocated:
            new_blocks.append(MemoryBlock(cursor, b.size, True, b.process_id))
            cursor += b.size

        if cursor < self.total_memory:
            new_blocks.append(MemoryBlock(cursor, self.total_memory - cursor))

        self.blocks = new_blocks
        self.compaction_count += 1
        return {"success": True, "compaction_count": self.compaction_count}

    def analyze(self) -> dict:
        #return fragmentation stats and other insights (About current memory state)
        free_blocks = [b for b in self.blocks if not b.is_allocated]
        alloc_blocks = [b for b in self.blocks if b.is_allocated]
        return {
            "fragmentationCount":         len(free_blocks),
            "externalFragmentationRatio": self._ext_frag_ratio(),
            "totalFreeMemory":            sum(b.size for b in free_blocks),
            "totalAllocatedMemory":       sum(b.size for b in alloc_blocks),
            "largestFreeBlock":           max((b.size for b in free_blocks), default=0),
            "allocatedBlockCount":        len(alloc_blocks),
        }

    def get_state(self) -> dict:
        #Serialisable state for payload 
        return {
            "totalMemory":    self.total_memory,
            "strategy":       self.strategy.value,
            "blocks":         [b.to_dict() for b in self.blocks],
            "compactionCount": self.compaction_count,
            **self.analyze(),
        }

    #helping functions

    def _find_block(self, size: int) -> int:
        free = [(i, b) for i, b in enumerate(self.blocks) if not b.is_allocated and b.size >= size]
        if not free:
            return -1
        if self.strategy == AllocationStrategy.FIRST_FIT:
            return free[0][0]
        if self.strategy == AllocationStrategy.BEST_FIT:
            return min(free, key=lambda x: x[1].size)[0]
        if self.strategy == AllocationStrategy.WORST_FIT:
            return max(free, key=lambda x: x[1].size)[0]
        return -1

    def _merge_free_blocks(self):
        i = 0
        while i < len(self.blocks) - 1:
            cur, nxt = self.blocks[i], self.blocks[i + 1]
            if not cur.is_allocated and not nxt.is_allocated:
                self.blocks[i] = MemoryBlock(cur.start_address, cur.size + nxt.size)
                self.blocks.pop(i + 1)
            else:
                i += 1

    def _ext_frag_ratio(self) -> float:
        total = len(self.blocks)
        if total == 0:
            return 0.0
        free = sum(1 for b in self.blocks if not b.is_allocated)
        return round(free / total, 4)