#include <iostream>
#include <vector>
#include <map>
#include "header/PrerequisiteDAG.h"

// Core simulation for OS Memory and Scheduling
class SimulationEngine {
public:
    void simulateStep(float entropy_delta) {
        // Placeholder for PID-driven difficulty scaling logic
        std::cout << "Simulating with entropy: " << entropy_delta << std::endl;
    }
};

// prerequisite DAG implemented, basically it checks whether the player is ready to unlock particular levels based on the probabilistic mastery scores 

int main() {
    SimulationEngine engine;
    engine.simulateStep(0.05f);

    // exploring the richer prerequisite DAG
    PrerequisiteDAG dag;
    std::map<std::string, float> mastery;

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

    return 0;
}