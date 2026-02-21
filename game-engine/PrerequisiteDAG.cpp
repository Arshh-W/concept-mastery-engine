#include "header/PrerequisiteDAG.h"

PrerequisiteDAG::PrerequisiteDAG() {
    // seed simple for demonstration, will be loaded from our database later
    nodes["basic"] = {"basic", "Basic Skill", {}};
}

std::string PrerequisiteDAG::getNextCompetency(const std::map<std::string, float>& masteryScores) const {
    for (const auto& [id, node] : nodes) {
        auto it = masteryScores.find(id);
        if (it == masteryScores.end() || it->second < 0.95f) {
            // checking all the prerequisites
            bool ready = true;
            for (const auto& prereq : node.prerequisites) {
                auto pit = masteryScores.find(prereq);
                if (pit == masteryScores.end() || pit->second < 0.95f) {
                    ready = false;
                    break;
                }
            }
            if (ready) return id;
        }
    }
    return "";
}
