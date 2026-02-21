#ifndef MEMORY_SIMULATOR_H
#define MEMORY_SIMULATOR_H

#include <vector>
#include <string>
#include <algorithm>
#include <cmath>
#include <climits>

/*
 MemorySimulator.h - OS Memory Management Simulation

 Simulates real-world memory allocation strategies:
 - First Fit: Allocates to the first suitable hole
 - Best Fit: Allocates to the tightest suitable hole
 - Worst Fit: Allocates to the largest suitable hole
 These are fundamental concepts that learners need to master
 for understanding OS memory management.
 */

enum class AllocationStrategy {
    FIRST_FIT,
    BEST_FIT,
    WORST_FIT
};

struct MemoryBlock {
    int processId;       // 0 = free, >0 = allocated to process
    int size;            // Size in KB
    int startAddress;    // Starting address
    bool isAllocated;    // True if allocated

    MemoryBlock(int start, int sz)
        : processId(0), size(sz), startAddress(start), isAllocated(false) {}

    int getEndAddress() const { return startAddress + size; }

    std::string toJsonString() const {
        std::string json = "{";
        json += "\"processId\":" + std::to_string(processId) + ",";
        json += "\"size\":" + std::to_string(size) + ",";
        json += "\"startAddress\":" + std::to_string(startAddress) + ",";
        json += "\"isAllocated\":" + std::string(isAllocated ? "true" : "false") + ",";
        json += "\"endAddress\":" + std::to_string(getEndAddress());
        json += "}";
        return json;
    }
};

class MemorySimulator {
private:
    std::vector<MemoryBlock> memoryBlocks;
    int totalMemory;                    // Total memory in KB
    AllocationStrategy strategy;
    int fragmentationCount;             // Number of free holes
    float externalFragmentationRatio;
    int compactionCount;

    /*
     Calculating fragmentation metrics by counting free blocks and
     computing the ratio of fragmented holes to total blocks
     */
    void calculateFragmentation() {
        int freeBlocks = 0;
        for (const auto& block : memoryBlocks) {
            if (!block.isAllocated) {
                freeBlocks++;
            }
        }
        fragmentationCount = freeBlocks;
        if (memoryBlocks.size() > 0) {
            externalFragmentationRatio = static_cast<float>(freeBlocks) / static_cast<float>(memoryBlocks.size());
        }
    }

    /*
     Finding first suitable free block (first fit strategy)
     returns index or -1 if no block found
     */
    int findFirstFitBlock(int size) {
        for (size_t i = 0; i < memoryBlocks.size(); ++i) {
            if (!memoryBlocks[i].isAllocated && memoryBlocks[i].size >= size) {
                return i;
            }
        }
        return -1;
    }

    /*
     Finding best fit free block (tightest hole that still fits the request)
     */
    int findBestFitBlock(int size) {
        int bestIdx = -1;
        int bestSize = INT_MAX;
        for (size_t i = 0; i < memoryBlocks.size(); ++i) {
            if (!memoryBlocks[i].isAllocated && memoryBlocks[i].size >= size) {
                if (memoryBlocks[i].size < bestSize) {
                    bestSize = memoryBlocks[i].size;
                    bestIdx = i;
                }
            }
        }
        return bestIdx;
    }

    /*
     Finding worst fit free block (largest available hole)
     */
    int findWorstFitBlock(int size) {
        int worstIdx = -1;
        int worstSize = -1;
        for (size_t i = 0; i < memoryBlocks.size(); ++i) {
            if (!memoryBlocks[i].isAllocated && memoryBlocks[i].size >= size) {
                if (memoryBlocks[i].size > worstSize) {
                    worstSize = memoryBlocks[i].size;
                    worstIdx = i;
                }
            }
        }
        return worstIdx;
    }

public:
    /*
     Constructing memory simulator with total memory size and allocation strategy.
     Initializes with one large free block representing entire available memory
     */
    MemorySimulator(int memory = 4096, AllocationStrategy strat = AllocationStrategy::FIRST_FIT)
        : totalMemory(memory), strategy(strat), fragmentationCount(0),
          externalFragmentationRatio(0.0f), compactionCount(0) {
        memoryBlocks.emplace_back(0, memory);
        calculateFragmentation();
    }

    /*
     Allocating memory for a process. Returns true if successful, false if no
     suitable hole found. outAddress contains the starting address of allocated block
     */
    bool allocateMemory(int processId, int size, int& outAddress) {
        if (size <= 0 || size > totalMemory) return false;

        int blockIdx = -1;

        switch (strategy) {
            case AllocationStrategy::FIRST_FIT:
                blockIdx = findFirstFitBlock(size);
                break;
            case AllocationStrategy::BEST_FIT:
                blockIdx = findBestFitBlock(size);
                break;
            case AllocationStrategy::WORST_FIT:
                blockIdx = findWorstFitBlock(size);
                break;
        }

        if (blockIdx == -1) return false;

        MemoryBlock& block = memoryBlocks[blockIdx];
        outAddress = block.startAddress;

        // If block is larger than needed, split it
        if (block.size > size) {
            MemoryBlock newFreeBlock(block.startAddress + size, block.size - size);
            memoryBlocks.insert(memoryBlocks.begin() + blockIdx + 1, newFreeBlock);
        }

        // Mark block as allocated
        block.isAllocated = true;
        block.processId = processId;
        block.size = size;

        calculateFragmentation();
        return true;
    }

    /*
     Deallocating memory at a given address. Merges adjacent free blocks
     to reduce fragmentation
     */
    bool deallocateMemory(int address) {
        for (auto& block : memoryBlocks) {
            if (block.startAddress == address && block.isAllocated) {
                block.isAllocated = false;
                block.processId = 0;
                mergeAdjacentFreeBlocks();
                calculateFragmentation();
                return true;
            }
        }
        return false;
    }

    /*
     Merging adjacent free blocks to combat external fragmentation
     */
    void mergeAdjacentFreeBlocks() {
        for (size_t i = 0; i < memoryBlocks.size() - 1; ++i) {
            if (!memoryBlocks[i].isAllocated && !memoryBlocks[i + 1].isAllocated) {
                if (memoryBlocks[i].getEndAddress() == memoryBlocks[i + 1].startAddress) {
                    memoryBlocks[i].size += memoryBlocks[i + 1].size;
                    memoryBlocks.erase(memoryBlocks.begin() + i + 1);
                    --i;
                }
            }
        }
    }

    /*
     Performing memory compaction by moving all allocated blocks to the start
     and creating one large free block at the end. This eliminates external fragmentation.
     */
    void performCompaction() {
        std::vector<MemoryBlock> compacted;
        int currentAddress = 0;

        // Move all allocated blocks to the beginning
        for (auto& block : memoryBlocks) {
            if (block.isAllocated) {
                block.startAddress = currentAddress;
                compacted.push_back(block);
                currentAddress += block.size;
            }
        }

        // Add one large free block at the end
        if (currentAddress < totalMemory) {
            compacted.emplace_back(currentAddress, totalMemory - currentAddress);
        }

        memoryBlocks = compacted;
        compactionCount++;
        calculateFragmentation();
    }

    /*
     Getting fragmentation count (number of free holes)
     */
    int getFragmentationCount() const { return fragmentationCount; }

    /*
     Getting external fragmentation ratio as a float between 0 and 1
     */
    float getExternalFragmentationRatio() const { return externalFragmentationRatio; }

    /*
     Getting total allocated memory across all allocated blocks
     */
    int getTotalAllocatedMemory() const {
        int total = 0;
        for (const auto& block : memoryBlocks) {
            if (block.isAllocated) total += block.size;
        }
        return total;
    }

    /*
     Getting number of times compaction has been performed
     */
    int getCompactionCount() const { return compactionCount; }

    /*
     Serializing current memory state to JSON-like string format
     */
    std::string getStateJsonString() const {
        std::string json = "{";
        json += "\"totalMemory\":" + std::to_string(totalMemory) + ",";
        json += "\"strategy\":\"" + std::string(
            strategy == AllocationStrategy::FIRST_FIT ? "FIRST_FIT" :
            strategy == AllocationStrategy::BEST_FIT ? "BEST_FIT" :
            "WORST_FIT"
        ) + "\",";
        json += "\"fragmentationCount\":" + std::to_string(fragmentationCount) + ",";
        json += "\"externalFragmentationRatio\":" + std::to_string(externalFragmentationRatio) + ",";
        json += "\"compactionCount\":" + std::to_string(compactionCount) + ",";
        json += "\"memoryBlocks\":[";
        for (size_t i = 0; i < memoryBlocks.size(); ++i) {
            json += memoryBlocks[i].toJsonString();
            if (i < memoryBlocks.size() - 1) json += ",";
        }
        json += "]";
        json += "}";
        return json;
    }

    /*
     Getting count of allocated blocks currently in memory
     */
    int getAllocatedBlockCount() const {
        int count = 0;
        for (const auto& block : memoryBlocks) {
            if (block.isAllocated) count++;
        }
        return count;
    }

    /*
     Resetting memory simulator to initial state with one large free block
     */
    void reset() {
        memoryBlocks.clear();
        memoryBlocks.emplace_back(0, totalMemory);
        fragmentationCount = 0;
        externalFragmentationRatio = 0.0f;
        compactionCount = 0;
    }
};

#endif // MEMORY_SIMULATOR_H
