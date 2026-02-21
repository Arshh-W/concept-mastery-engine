#ifndef MEMORY_SIMULATOR_H
#define MEMORY_SIMULATOR_H

#include <vector>
#include <string>
#include <algorithm>
#include <cmath>
#include <climits>

/*
 MemorySimulator.h - OS Memory Management Simulation

 Simulates actual memory allocation strategies:
 - First Fit: Allocates to the first suitable hole
 - Best Fit: Allocates to the tightest suitable hole
 - Worst Fit: Allocates to the largest suitable hole
 These replicate the fundamental concepts that learners need to master OS basics for memory managemnt.
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
    bool isAllocated;   // true if allocated, false if free

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

    //calculating fragmentation metrics after each allocation/deallocation to track memory state
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

    //finding first fit free block
    int findFirstFitBlock(int size) {
        for (size_t i = 0; i < memoryBlocks.size(); ++i) {
            if (!memoryBlocks[i].isAllocated && memoryBlocks[i].size >= size) {
                return i;
            }
        }
        return -1;
    }

    //finding best fit free block 
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

    //finding worst fit free block
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
     Initializes with one large free block. 
     */
    MemorySimulator(int memory = 4096, AllocationStrategy strat = AllocationStrategy::FIRST_FIT)
        : totalMemory(memory), strategy(strat), fragmentationCount(0),
          externalFragmentationRatio(0.0f), compactionCount(0) {
        memoryBlocks.emplace_back(0, memory);
        calculateFragmentation();
    }

    //allocating memory for a process with the state, size, etc and returning starting address if successful 
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
        int newFreeBlockSize = block.size - size;

        // If block is larger than needed, We split it
        if (newFreeBlockSize > 0) {
            MemoryBlock newFreeBlock(block.startAddress + size, newFreeBlockSize);
            memoryBlocks.insert(memoryBlocks.begin() + blockIdx + 1, newFreeBlock);
        }

        memoryBlocks[blockIdx].isAllocated = true;
        memoryBlocks[blockIdx].processId = processId;
        memoryBlocks[blockIdx].size = size;

        calculateFragmentation();
        return true;
    }

    //for deallocating memory based on an address
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

    //Merging adjacent free blocks to reduce frag after deallocation
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

    
    void performCompaction() {
        std::vector<MemoryBlock> compacted;
        int currentAddress = 0;

        // Moving all allocated blocks to the beginning
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

    //getting current frag count (number of free holes)
    int getFragmentationCount() const { return fragmentationCount; }

    //external fragmentation ratio ( Free holes/ Total blocks)
    float getExternalFragmentationRatio() const { return externalFragmentationRatio; }

    //getting total allocated memory in KB
    int getTotalAllocatedMemory() const {
        int total = 0;
        for (const auto& block : memoryBlocks) {
            if (block.isAllocated) total += block.size;
        }
        return total;
    }

    //getting count of performed compactions, used for analyzsing different strategies
    int getCompactionCount() const { return compactionCount; }

    //serializing current memory state to a JSON-like string for logging or analysis
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

    
     //Getting count of allocated blocks currently in memory

    int getAllocatedBlockCount() const {
        int count = 0;
        for (const auto& block : memoryBlocks) {
            if (block.isAllocated) count++;
        }
        return count;
    }

    
    //Resetting the simulator to initial state with one large free block
    void reset() {
        memoryBlocks.clear();
        memoryBlocks.emplace_back(0, totalMemory);
        fragmentationCount = 0;
        externalFragmentationRatio = 0.0f;
        compactionCount = 0;
    }
};

#endif // MEMORY_SIMULATOR_H
