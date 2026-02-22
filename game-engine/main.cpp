#include <iostream>
#include <vector>
#include <map>
#include "header/PrerequisiteDAG.h"
#include "header/Utils.h"
#include "header/Telemetry.h"
#include "header/MemorySimulator.h"
#include "header/SimulationCore.h"

// Core simulation for OS Memory and Scheduling
class SimulationEngine {
private:
    // Global PrerequisiteDAG instance 
    PrerequisiteDAG dag;

    // Global mastery scores — updated by BKT backend after each session
    std::map<std::string, float> masteryScores;

    // Global session ID — generated once per run, forwarded to Flask for BKT logging
    std::string sessionId;

    // Internal SimulationCore pointer — handles PID and telemetry orchestration
    SimulationCore* core = nullptr;

public:
    SimulationEngine() {
        // Generate a unique session ID for this run — sent to Flask for BKT logging
        sessionId = Utils::generateSessionId();
        std::cout << "Session initialized: " << sessionId << "\n";
        std::cout << "Timestamp: " << Utils::getCurrentTimestamp() << "\n";
    }

    ~SimulationEngine() {
        if (core) delete core;
    }

    void simulateStep(float entropy_delta) {
        // Placeholder for PID-driven difficulty scaling logic
        std::cout << "Simulating with entropy: " << entropy_delta << std::endl;
    }

    std::string selectNextCompetencyDomain(const std::string& preferredDomain = "") {
        std::string nextCompetency = dag.getNextCompetency(masteryScores, preferredDomain);
        std::cout << "\n[DAG] Next recommended competency: " << nextCompetency << "\n";

        // Map competency ID to a simulation domain
        // DAG node IDs starting with "mem_" -> OS_MEMORY
        // DAG node IDs starting with "btree_" or "query_" -> DBMS
        // everything else -> OS_MEMORY safe default for early learning path
        if (nextCompetency.find("mem_")  == 0 || nextCompetency.find("alloc") == 0 ||
            nextCompetency.find("frag")  == 0 || nextCompetency.find("page")  == 0) {
            return "OS_MEMORY";
        } else if (nextCompetency.find("btree") == 0 || nextCompetency.find("query") == 0 ||
                   nextCompetency.find("index") == 0) {
            return "DBMS";
        }
        return "OS_MEMORY";
    }

   
    void printEventLog() {
        if (!core) return;

        const auto& log = core->getEventLog();
        std::cout << "\n[EventBus] Event log (" << log.size() << " events):\n";

        for (size_t i = 0; i < log.size(); ++i) {
            const auto& evt = log[i];
            std::string typeName;
            switch (evt.type) {
                case EventType::MEMORY_ALLOCATION_SUCCESS:     typeName = "MEM_ALLOC_SUCCESS";  break;
                case EventType::MEMORY_ALLOCATION_FAILURE:     typeName = "MEM_ALLOC_FAILURE";  break;
                case EventType::MEMORY_DEALLOCATION:           typeName = "MEM_DEALLOC";         break;
                case EventType::MEMORY_COMPACTION_TRIGGERED:   typeName = "MEM_COMPACT";         break;
                case EventType::MEMORY_FRAGMENTATION_DETECTED: typeName = "MEM_FRAG_DETECTED";  break;
                case EventType::QUERY_EXECUTION_COMPLETE:      typeName = "QUERY_COMPLETE";      break;
                case EventType::DIFFICULTY_ADJUSTED:           typeName = "DIFFICULTY_ADJUSTED"; break;
                case EventType::STATE_TRANSITION:              typeName = "STATE_TRANSITION";    break;
                case EventType::SIMULATION_ERROR:              typeName = "SIMULATION_ERROR";    break;
                case EventType::SIMULATION_COMPLETE:           typeName = "SIMULATION_COMPLETE"; break;
                default: typeName = "EVENT_" + std::to_string((int)evt.type);                   break;
            }
            std::cout << "  [" << i << "] " << typeName;
            // Printing entropy from payload if present — key signal for difficulty scaling
            if (evt.payload.isMember("entropy"))
                std::cout << " | entropy=" << evt.payload["entropy"].asFloat();
            if (evt.payload.isMember("success"))
                std::cout << " | success=" << (evt.payload["success"].asBool() ? "true" : "false");
            std::cout << "\n";
        }
    }

    //computing entropy measures 
    void computeSessionEntropyMetrics(const Json::Value& telemetry) {
        const Json::Value& observations = telemetry["observations"];
        if (observations.empty()) return;

        int successes = 0;
        std::vector<float> responseTimes;

        for (const auto& obs : observations) {
            if (obs["success"].asBool()) successes++;
            responseTimes.push_back(obs["responseTime"].asFloat());
        }

        int total = observations.size();
        float pSuccess = static_cast<float>(successes) / total;
        float pFailure = 1.0f - pSuccess;

        // Shannon entropy over binary outcome distribution
        std::vector<float> probs;
        if (pSuccess > 0) probs.push_back(pSuccess);
        if (pFailure > 0) probs.push_back(pFailure);
        float sessionEntropy = Utils::shannonEntropy(probs);

        // Standard deviation of response times (measures cognitive load consistency)
        float rtStdDev = Utils::standardDeviation(responseTimes);

        std::cout << "\n[Session Metrics for BKT]\n";
        std::cout << "  Shannon Entropy (outcome distribution): " << sessionEntropy
                  << " (0=consistent, 1=random)\n";
        std::cout << "  Response Time Std Dev: " << rtStdDev
                  << "s (low = stable processing speed)\n";
        std::cout << "  Interpretation: "
                  << (sessionEntropy < 0.5f ? "Learner is converging on mastery."
                    : sessionEntropy < 0.8f ? "Learner is making progress but still inconsistent."
                    : "High variability — consider reducing difficulty.")
                  << "\n";
    }

    //running a full session to demomnstrate our workflow
    void runFullSession() {
        std::cout << "\n=== SimulationCore Session ===\n";

        // --- DAG: select the appropriate domain based on current mastery ---
        std::string recommendedDomain = selectNextCompetencyDomain();
        std::cout << "[DAG] Running session for domain: " << recommendedDomain << "\n";

        // --- DAG: gate advanced actions behind prerequisite mastery ---
        bool canDoCompaction = dag.canUnlock("mem_compaction", masteryScores);
        bool canDoRangeQuery = dag.canUnlock("query_range",    masteryScores);
        std::cout << "[DAG] Compaction unlocked: " << (canDoCompaction ? "yes" : "no") << "\n";
        std::cout << "[DAG] Range queries unlocked: " << (canDoRangeQuery ? "yes" : "no") << "\n";

        // Build SimulationConfig and spin up the core
        SimulationConfig simConfig;
        simConfig.domain            = (recommendedDomain == "DBMS") ? Domain::DBMS : Domain::OS_MEMORY;
        simConfig.memoryStrategy    = AllocationStrategy::FIRST_FIT;
        simConfig.totalMemory       = 2048;
        simConfig.dbmsTableSize     = 5000;
        simConfig.startingEntropy   = 0.5f;
        simConfig.targetSuccessRate = 0.7f;
        simConfig.maxIterations     = 15;

        if (core) delete core;
        core = new SimulationCore(simConfig);
        core->start();

        // Step loop — mirrors the Flask POST /simulate/step calls
        for (int i = 0; i < 8; i++) {
            std::cout << "\n--- Step " << (i + 1) << " ---\n";

            // PAUSE/RESUME DEMO: show how we can inspect state mid-session
            if (i == 4) {
                core->pause();
                std::cout << "[State Machine] PAUSED at step " << (i + 1) << "\n";
                auto ps = core->getSystemState();
                std::cout << "[State Machine] Confirmed state: "
                          << ps["simulationState"].asString() << "\n";
                core->resume();
                std::cout << "[State Machine] RESUMED.\n";
            }

            Json::Value action;
            if (i < 4) {
                action["action"]    = "allocate";
                action["processId"] = i + 1;
                action["size"]      = 256 + (i * 100);
            } else if (i == 5 && canDoCompaction) {
        
                action["action"] = "compact";
                std::cout << "[DAG] Executing compaction (prerequisite met).\n";
            } else if (i < 7) {
                action["action"] = "analyze";
            } else {
                action["action"]  = "deallocate";
                action["address"] = 2048;
            }

            core->simulateStep(action);

            auto state = core->getSystemState();
            std::cout << "Current Entropy: " << state["currentEntropy"].asFloat() << "\n";
            std::cout << "Iteration: "       << state["iterationCount"].asInt()   << "\n";
            if (state.isMember("memory")) {
                std::cout << "Memory Fragmentation: "
                          << state["memory"]["fragmentationCount"].asInt() << " holes\n";
            }
        }

        // EVENT LOG: printing the full event trace for this session 
        printEventLog();

        // TELEMETRY + ENTROPY METRICS
        std::cout << "\n=== Final Telemetry for BKT ===\n";
        auto telemetry = core->getTelemetryData();
        std::cout << "Session ID: "         << sessionId                                 << "\n";
        std::cout << "Success Rate: "       << telemetry["successRate"].asFloat()        << "\n";
        std::cout << "Avg Response Time: "  << telemetry["averageResponseTime"].asFloat() << "s\n";
        std::cout << "Total Observations: " << telemetry["observations"].size()          << "\n";
        computeSessionEntropyMetrics(telemetry);

        // DAG: updating mastery and show next recommended competency 
        std::cout << "\n[DAG] Simulating mastery update post-session...\n";
        auto level0 = dag.getCompetenciesAtLevel(0);
        if (!level0.empty()) {
            masteryScores[level0[0]] = telemetry["successRate"].asFloat();
            std::cout << "[DAG] Updated mastery for '" << level0[0]
                      << "': " << masteryScores[level0[0]] << "\n";
        }
        std::cout << "[DAG] Next recommended competency after this session: "
                  << dag.getNextCompetency(masteryScores) << "\n";
    }

    std::string getSessionId() const { return sessionId; }
};

int main() {
    SimulationEngine engine;
    engine.simulateStep(0.05f);

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

    engine.runFullSession();

    return 0;
}