#include <iostream>
#include <vector>
#include <map>
#include "header/PrerequisiteDAG.h"
#include "header/Utils.h"
#include "header/Telemetry.h"
#include "header/MemorySimulator.h"

// Core simulation for OS Memory and Scheduling
class SimulationEngine {
public:
    void simulateStep(float entropy_delta) {
        // Placeholder for PID-driven difficulty scaling logic
        std::cout << "Simulating with entropy: " << entropy_delta << std::endl;
    }
};

// prerequisite DAG implemented, basically it checks whether the player is 
// ready to unlock particular levels based on the probabilistic mastery scores 

int main() {
    SimulationEngine engine;
    engine.simulateStep(0.05f);

    // exploring the richer prerequisite DAG
    PrerequisiteDAG dag;
    std::map<std::string, float> mastery;

    // utilities
    std::cout << "Current timestamp: " << Utils::getCurrentTimestamp() << "\n";
    std::cout << "Session ID example: " << Utils::generateSessionId() << "\n";
    std::cout << "Clamp 5 to [0,3]: " << Utils::clamp(5, 0, 3) << "\n";

    std::string next = dag.getNextCompetency(mastery);
    std::cout << "Next competency available: " << next << "\n";

    // list level 0 competencies
    auto level0 = dag.getCompetenciesAtLevel(0);
    std::cout << "Level 0 skills:";
    for (auto& id : level0) std::cout << " " << id;
    std::cout << "\n";

    // JSON-like string and  then logging the first portion
    std::string json = dag.toJson();
    std::cout << "Serialized graph (truncated): " << json.substr(0, 200) << "...\n";

    // telemetry system for recording a user attempt
    TelemetryCollector telemetry;
    ObservedResponse response1 = {
        "allocate_memory",
        true,
        2.5f,
        "OS_Memory",
        "basic_alloc",
        5.0f,
        0.45f,
        Utils::getCurrentTimestamp(),
        "user_completed_task_successfully"
    };
    telemetry.recordObservation(response1);

    std::cout << "Telemetry - Success rate: " << telemetry.getSuccessRate() << "\n";
    std::cout << "Telemetry - Avg response time: " << telemetry.getAverageResponseTime() << "s\n";

    // memory simulator demo - testing different allocation strategies
    std::cout << "\n--- Memory Simulator Demo ---\n";
    MemorySimulator memSim(1024, AllocationStrategy::FIRST_FIT);
    int addr1, addr2;
    if (memSim.allocateMemory(1, 256, addr1)) {
        std::cout << "Allocated 256KB for process 1 at address " << addr1 << "\n";
    }
    if (memSim.allocateMemory(2, 128, addr2)) {
        std::cout << "Allocated 128KB for process 2 at address " << addr2 << "\n";
    }
    std::cout << "Fragmentation count: " << memSim.getFragmentationCount() << "\n";
    std::cout << "External fragmentation ratio: " << memSim.getExternalFragmentationRatio() << "\n";
    std::cout << "Total allocated: " << memSim.getTotalAllocatedMemory() << "KB\n";

    return 0;
}