#ifndef SIMULATION_CORE_H
#define SIMULATION_CORE_H

#include "EventSystem.h"
#include "MemorySimulator.h"
#include "DBMSSimulator.h"
#include "PIDController.h"
#include "Telemetry.h"
#include <json/json.h>
#include <chrono>
#include <sstream>
#include <iomanip>

/*
SimulationCore.h - The Main Orchestration logic for our game engine
This is the "brain", responsible for following tasks: 
 1. Manage the state machine for the simulation
 2. Orchestrate interactions between Memory and DBMS simulators
 3. Apply PID-driven difficulty scaling
 4. Collect telemetry for the Python BKT layer
 5. Manage the event bus for all communications
 */

enum class SimulationState {
    IDLE,
    RUNNING,
    PAUSED,
    ERROR,
    COMPLETE
};

enum class Domain {
    OS_MEMORY,
    DBMS,
    HYBRID
};

struct SimulationConfig {
    Domain domain;
    int totalMemory;
    AllocationStrategy memoryStrategy;
    int dbmsTableSize;
    float startingEntropy;
    float targetSuccessRate;
    int maxIterations;
};

class SimulationCore {
private:
    SimulationState state;
    EventBus eventBus;
    MemorySimulator* memorySimulator;
    DBMSSimulator* dbmsSimulator;
    PIDController pidController;
    TelemetryCollector telemetry;
    
    // Simulation parameters
    float currentEntropy;
    int iterationCount;
    int maxIterations;
    Domain currentDomain;
    std::chrono::high_resolution_clock::time_point simulationStartTime;
    
    std::string getCurrentTimestamp() {
        auto now = std::chrono::system_clock::now();
        auto time = std::chrono::system_clock::to_time_t(now);
        std::stringstream ss;
        ss << std::put_time(std::localtime(&time), "%Y-%m-%d %H:%M:%S");
        return ss.str();
    }
    
public:
    SimulationCore(const SimulationConfig& config)
        : state(SimulationState::IDLE), 
          currentEntropy(config.startingEntropy),
          iterationCount(0),
          maxIterations(config.maxIterations),
          currentDomain(config.domain),
          pidController(0.5f, 0.1f, 0.05f, config.targetSuccessRate) {
        
        // Initialize domain-specific simulators
        if (config.domain == Domain::OS_MEMORY || config.domain == Domain::HYBRID) {
            memorySimulator = new MemorySimulator(config.totalMemory, config.memoryStrategy);
            eventBus.subscribe(EventType::MEMORY_ALLOCATION_REQUEST, memorySimulator);
        }
        
        if (config.domain == Domain::DBMS || config.domain == Domain::HYBRID) {
            dbmsSimulator = new DBMSSimulator(4, config.dbmsTableSize);
            eventBus.subscribe(EventType::QUERY_EXECUTION_START, dbmsSimulator);
        }
    }
    
    ~SimulationCore() {
        if (memorySimulator) delete memorySimulator;
        if (dbmsSimulator) delete dbmsSimulator;
    }
    
    //start the simulation
    void start() {
        if (state != SimulationState::IDLE) return;
        
        state = SimulationState::RUNNING;
        simulationStartTime = std::chrono::high_resolution_clock::now();
        iterationCount = 0;
        currentEntropy = 0.5f;
        
        Json::Value payload;
        payload["domain"] = currentDomain == Domain::OS_MEMORY ? "OS_MEMORY" :
                           currentDomain == Domain::DBMS ? "DBMS" : "HYBRID";
        
        Event startEvent(EventType::STATE_TRANSITION, payload);
        eventBus.publish(startEvent);
    }
    
    //executing a simulation step based on user choice, and appying PID based adjustments
    bool simulateStep(const Json::Value& userAction) {
        if (state != SimulationState::RUNNING) return false;
        if (iterationCount >= maxIterations) {
            state = SimulationState::COMPLETE;
            return false;
        }
        
        try {
            std::string action = userAction.get("action", "").asString();
            
            if (currentDomain == Domain::OS_MEMORY || currentDomain == Domain::HYBRID) {
                executeMemoryOperation(action, userAction);
            }
            
            if (currentDomain == Domain::DBMS || currentDomain == Domain::HYBRID) {
                executeDBMSOperation(action, userAction);
            }
            
            // Applying PID-based difficulty scaling
            float performanceMetric = telemetry.getSuccessRate();
            float entropyAdjustment = pidController.getEntropyAdjustment(performanceMetric);
            currentEntropy = std::max(0.0f, std::min(1.0f, currentEntropy + entropyAdjustment));
            
            // Publishing difficulty adjustment event
            Json::Value difficultyPayload;
            difficultyPayload["entropy"] = currentEntropy;
            difficultyPayload["adjustment"] = entropyAdjustment;
            difficultyPayload["performance"] = performanceMetric;
            Event diffEvent(EventType::DIFFICULTY_ADJUSTED, difficultyPayload);
            eventBus.publish(diffEvent);
            
            iterationCount++;
            
        } catch (const std::exception& e) {
            state = SimulationState::ERROR;
            Json::Value errorPayload;
            errorPayload["error"] = e.what();
            Event errorEvent(EventType::SIMULATION_ERROR, errorPayload);
            eventBus.publish(errorEvent);
            return false;
        }
        
        return true;
    }
    
private:
    void executeMemoryOperation(const std::string& action, const Json::Value& params) {
        if (!memorySimulator) return;
        
        if (action == "allocate") {
            int processId = params.get("processId", 1).asInt();
            int size = params.get("size", 512).asInt();
            int address = 0;
            
            auto start = std::chrono::high_resolution_clock::now();
            bool success = memorySimulator->allocateMemory(processId, size, address);
            auto end = std::chrono::high_resolution_clock::now();
            float responseTime = std::chrono::duration<float>(end - start).count();
            
            // Record observation for BKT
            ObservedResponse obs;
            obs.userAction = "allocate_memory";
            obs.success = success;
            obs.responseTime = responseTime;
            obs.domain = "OS_Memory";
            obs.competency = "Memory_Allocation";
            obs.entropy = currentEntropy;
            obs.timestamp = getCurrentTimestamp();
            obs.contextData["address"] = address;
            obs.contextData["size"] = size;
            
            telemetry.recordObservation(obs);
            
            // Publish event
            Json::Value payload;
            payload["success"] = success;
            payload["address"] = address;
            payload["size"] = size;
            payload["entropy"] = currentEntropy;
            
            Event event(success ? EventType::MEMORY_ALLOCATION_SUCCESS : EventType::MEMORY_ALLOCATION_FAILURE, payload);
            eventBus.publish(event);
            
        } else if (action == "deallocate") {
            int address = params.get("address", 0).asInt();
            bool success = memorySimulator->deallocateMemory(address);
            
            ObservedResponse obs;
            obs.userAction = "deallocate_memory";
            obs.success = success;
            obs.responseTime = 0.001f;
            obs.domain = "OS_Memory";
            obs.competency = "Memory_Management";
            obs.entropy = currentEntropy;
            obs.timestamp = getCurrentTimestamp();
            
            telemetry.recordObservation(obs);
            
            Event event(EventType::MEMORY_DEALLOCATION, Json::Value());
            eventBus.publish(event);
            
        } else if (action == "compact") {
            memorySimulator->performCompaction();
            
            ObservedResponse obs;
            obs.userAction = "compact_memory";
            obs.success = true;
            obs.responseTime = 0.01f;
            obs.domain = "OS_Memory";
            obs.competency = "Memory_Compaction";
            obs.entropy = currentEntropy;
            obs.timestamp = getCurrentTimestamp();
            
            telemetry.recordObservation(obs);
            
            Event event(EventType::MEMORY_COMPACTION_TRIGGERED, Json::Value());
            eventBus.publish(event);
            
        } else if (action == "analyze") {
            // User is analyzing fragmentation - success if identified correctly
            bool success = memorySimulator->getFragmentationCount() > 0;
            
            ObservedResponse obs;
            obs.userAction = "analyze_fragmentation";
            obs.success = success;
            obs.responseTime = 0.02f;
            obs.domain = "OS_Memory";
            obs.competency = "Fragmentation_Analysis";
            obs.entropy = currentEntropy;
            obs.timestamp = getCurrentTimestamp();
            
            telemetry.recordObservation(obs);
        }
    }
    
    void executeDBMSOperation(const std::string& action, const Json::Value& params) {
        if (!dbmsSimulator) return;
        
        auto start = std::chrono::high_resolution_clock::now();
        bool success = false;
        std::string operationType = "";
        
        if (action == "insert") {
            int key = params.get("key", 0).asInt();
            success = dbmsSimulator->insertKey(key);
            operationType = "insert";
            
        } else if (action == "delete") {
            int key = params.get("key", 0).asInt();
            success = dbmsSimulator->deleteKey(key);
            operationType = "delete";
            
        } else if (action == "query_with_index") {
            float selectivity = params.get("selectivity", 0.1f).asFloat();
            QueryPlan plan = dbmsSimulator->optimizeQuery(true, selectivity);
            success = plan.estimatedCost < 100; // Arbitrary success threshold
            operationType = "query_indexed";
            
        } else if (action == "query_without_index") {
            float selectivity = params.get("selectivity", 0.1f).asFloat();
            QueryPlan plan = dbmsSimulator->optimizeQuery(false, selectivity);
            success = plan.estimatedCost < 200; // Higher cost expected
            operationType = "query_unindexed";
            
        } else if (action == "range_query") {
            int start_key = params.get("startKey", 0).asInt();
            int end_key = params.get("endKey", 1000).asInt();
            bool hasIndex = params.get("hasIndex", false).asBool();
            QueryPlan plan = dbmsSimulator->rangeQuery(start_key, end_key, hasIndex);
            success = plan.estimatedCost < 150;
            operationType = "range_query";
        }
        
        auto end = std::chrono::high_resolution_clock::now();
        float responseTime = std::chrono::duration<float>(end - start).count();
        
        // Record observation
        ObservedResponse obs;
        obs.userAction = operationType;
        obs.success = success;
        obs.responseTime = responseTime;
        obs.domain = "DBMS";
        obs.competency = action == "query_with_index" ? "Index_Optimization" : 
                         action == "range_query" ? "Range_Queries" : "Query_Execution";
        obs.entropy = currentEntropy;
        obs.timestamp = getCurrentTimestamp();
        obs.contextData["nodeAccesses"] = dbmsSimulator->getNodeAccessCount();
        
        telemetry.recordObservation(obs);
        
        // Publish event
        Json::Value payload;
        payload["success"] = success;
        payload["nodeAccesses"] = dbmsSimulator->getNodeAccessCount();
        payload["entropy"] = currentEntropy;
        
        Event event(EventType::QUERY_EXECUTION_COMPLETE, payload);
        eventBus.publish(event);
    }
    
public:
    SimulationState getState() const { return state; }
    void pause() { if (state == SimulationState::RUNNING) state = SimulationState::PAUSED; }
    void resume() { if (state == SimulationState::PAUSED) state = SimulationState::RUNNING; }
    
    float getCurrentEntropy() const { return currentEntropy; }
    int getIterationCount() const { return iterationCount; }
    
    //exporting telemetry data for the BKT logic in backend layer to update the model and adapt
    Json::Value getTelemetryData() const {
        Json::Value root;
        root["observations"] = telemetry.getObservationsJson();
        root["successRate"] = telemetry.getSuccessRate();
        root["averageResponseTime"] = telemetry.getAverageResponseTime();
        root["currentEntropy"] = currentEntropy;
        root["iterationCount"] = iterationCount;
        return root;
    }
    
    //export current system state for analysis and db logging 
    Json::Value getSystemState() const {
        Json::Value root;
        root["simulationState"] = state == SimulationState::IDLE ? "IDLE" :
                                 state == SimulationState::RUNNING ? "RUNNING" :
                                 state == SimulationState::PAUSED ? "PAUSED" :
                                 state == SimulationState::ERROR ? "ERROR" : "COMPLETE";
        root["iterationCount"] = iterationCount;
        root["currentEntropy"] = currentEntropy;
        
        if (memorySimulator) {
            root["memory"] = memorySimulator->getStateJson();
        }
        if (dbmsSimulator) {
            root["dbms"] = dbmsSimulator->getStateJson();
        }
        
        root["telemetry"] = telemetry.getObservationsJson();
        
        return root;
    }
    
    //resetting simulation for a new session or after completion
    void reset() {
        state = SimulationState::IDLE;
        iterationCount = 0;
        currentEntropy = 0.5f;
        telemetry.reset();
        pidController.resetIntegral();
    }
};

#endif // SIMULATION_CORE_H