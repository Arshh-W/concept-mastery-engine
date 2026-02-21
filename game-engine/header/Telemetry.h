#ifndef TELEMETRY_H
#define TELEMETRY_H

#include <string>
#include <vector>
#include <chrono>

/*
 Telemetry.h - Observation Tracking for the Bayesian Knowledge Tracing

 Collects the user responses, performance basic metrics, and system states
 to feed into the Python BKT engine for mastery estimation. Also 
 tracks all the system change and randomness, response times, and success rates 
 that are needed to understand the learner.(Basically gets everything for our BKT model to work with)
 */

struct ObservedResponse {
    std::string userAction;          // e.g., "allocate_memory", "create_index"
    bool success;                    // sucess or not?
    float responseTime;              // Time taken (seconds)
    std::string domain;              // "OS_Memory" or "DBMS"
    std::string competency;          // e.g., "Paging", "B-Trees", "First-Fit"
    float estimatedTimeToCompletion; // ETC for PID control
    float entropy;                   // Current system entropy(randomness) level, needed for PID and difficulty scaling
    std::string timestamp;
    std::string contextData;         // Additional metadata as string

    std::string toJsonString() const {
        std::string json = "{";
        json += "\"userAction\":\"" + userAction + "\",";
        json += "\"success\":" + std::string(success ? "true" : "false") + ",";
        json += "\"responseTime\":" + std::to_string(responseTime) + ",";
        json += "\"domain\":\"" + domain + "\",";
        json += "\"competency\":\"" + competency + "\",";
        json += "\"estimatedTimeToCompletion\":" + std::to_string(estimatedTimeToCompletion) + ",";
        json += "\"entropy\":" + std::to_string(entropy) + ",";
        json += "\"timestamp\":\"" + timestamp + "\",";
        json += "\"contextData\":\"" + contextData + "\"";
        json += "}";
        return json;
    }
};

class TelemetryCollector {
private:
    std::vector<ObservedResponse> observations;
    float cumulativeEntropy;
    int successCount;
    int totalAttempts;

public:
    
    //Initializing the telemetry collector with default entropy and counters at zero
    TelemetryCollector()
        : cumulativeEntropy(0.5f), successCount(0), totalAttempts(0) {}


    // Recording a single observation (user response, success/failure, timing data, entropy)
     //and updating aggregate statistics for tracking overall performance
    void recordObservation(const ObservedResponse& obs) {
        observations.push_back(obs);
        totalAttempts++;
        if (obs.success) successCount++;
        cumulativeEntropy = (cumulativeEntropy + obs.entropy) / 2.0f; // Moving average
    }

    //Computing success rate as a fraction of successful attempts out of total attempts
    // useful for determining if learner is ready to progress, needed for the BKT model and PID 
    float getSuccessRate() const {
        if (totalAttempts == 0) return 0.0f;
        return static_cast<float>(successCount) / static_cast<float>(totalAttempts);
    }

    
    // Calculating the average response time across all observations
    // long response times may indicate confusion or deeper learning processing
    
    float getAverageResponseTime() const {
        if (observations.empty()) return 0.0f;
        float sum = 0.0f;
        for (const auto& obs : observations) {
            sum += obs.responseTime;
        }
        return sum / observations.size();
    }


    //Serializing all observations to a JSON-like string format for logging or transmission
    //to our Python backend
    
    std::string getObservationsJsonString() const {
        std::string json = "[";
        for (size_t i = 0; i < observations.size(); ++i) {
            json += observations[i].toJsonString();
            if (i < observations.size() - 1) json += ",";
        }
        json += "]";
        return json;
    }


    //For raw observation vector used for detailed analysis or forwarding
    //to the BKT backend
    const std::vector<ObservedResponse>& getObservations() const {
        return observations;
    }

    //calculating current cummilative entropy as a measure of the overall uncertainty 
    // in the learner's performance, useful for PID control and difficulty adjustment
    float getCumulativeEntropy() const {
        return cumulativeEntropy;
    }

    
    //Resetting the collector state. For new sessions 
    
    void reset() {
        observations.clear();
        cumulativeEntropy = 0.5f;
        successCount = 0;
        totalAttempts = 0;
    }

    
    //Simple query to get the current total attempts recorded
    int getTotalAttempts() const {
        return totalAttempts;
    }

    //Simple query to get the current success count
    
    int getSuccessCount() const {
        return successCount;
    }
};

#endif // TELEMETRY_H
