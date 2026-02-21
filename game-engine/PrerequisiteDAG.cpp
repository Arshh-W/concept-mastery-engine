#include "header/PrerequisiteDAG.h"
#include <sstream>
#include <functional>

// """
// So What the prerequisite DAG does is that it we represent the learning paths for the game engine. 
// Each node in our graph represents a competency variable or skill, and edges represent all prerequisites to unlock it.
// The DAG allows us to determine which competencies are available to the player rn,
// based on their current probabilistic mastery scores, and it will also provide paths to unlock specific competencies.

// I read a lot of blogs to figure this out lol, tho it was quite intuitive. 
// """

PrerequisiteDAG::PrerequisiteDAG(float threshold)
    : masteryThreshold(threshold) {
    initializeDefaultGraph();
}

void PrerequisiteDAG::initializeDefaultGraph() {
    // OS_Memory Domain
    nodes["basic_alloc"] = {
        "basic_alloc",
        "Basic Memory Allocation",
        "OS_Memory",
        0.2f,
        5.0f,
        {},
        {"first_fit", "best_fit", "worst_fit", "frag_analysis"}
    };

    nodes["first_fit"] = {
        "first_fit",
        "First Fit Strategy",
        "OS_Memory",
        0.3f,
        8.0f,
        {"basic_alloc"},
        {"compare_strategies"}
    };

    nodes["best_fit"] = {
        "best_fit",
        "Best Fit Strategy",
        "OS_Memory",
        0.35f,
        8.0f,
        {"basic_alloc"},
        {"compare_strategies"}
    };

    nodes["worst_fit"] = {
        "worst_fit",
        "Worst Fit Strategy",
        "OS_Memory",
        0.35f,
        8.0f,
        {"basic_alloc"},
        {"compare_strategies"}
    };

    nodes["compare_strategies"] = {
        "compare_strategies",
        "Compare Allocation Strategies",
        "OS_Memory",
        0.4f,
        10.0f,
        {"first_fit", "best_fit", "worst_fit"},
        {"frag_analysis"}
    };

    nodes["frag_analysis"] = {
        "frag_analysis",
        "Fragmentation Analysis",
        "OS_Memory",
        0.45f,
        10.0f,
        {"basic_alloc"},
        {"compaction"}
    };

    nodes["compaction"] = {
        "compaction",
        "Memory Compaction",
        "OS_Memory",
        0.5f,
        10.0f,
        {"frag_analysis"},
        {"paging"}
    };

    nodes["paging"] = {
        "paging",
        "Paging & Virtual Memory",
        "OS_Memory",
        0.7f,
        15.0f,
        {"compaction"},
        {"optimization"}
    };

    // DBMS Domain
    nodes["basic_index"] = {
        "basic_index",
        "Basic Indexing Concepts",
        "DBMS",
        0.25f,
        8.0f,
        {},
        {"btree", "index_selection"}
    };

    nodes["btree"] = {
        "btree",
        "B-Tree Operations",
        "DBMS",
        0.45f,
        12.0f,
        {"basic_index"},
        {"range_queries"}
    };

    nodes["range_queries"] = {
        "range_queries",
        "Range Queries & Scanning",
        "DBMS",
        0.55f,
        10.0f,
        {"btree"},
        {"query_optimization"}
    };

    nodes["index_selection"] = {
        "index_selection",
        "Index Selection & Design",
        "DBMS",
        0.6f,
        12.0f,
        {"basic_index"},
        {"query_optimization"}
    };

    nodes["query_optimization"] = {
        "query_optimization",
        "Advanced Query Optimization",
        "DBMS",
        0.75f,
        15.0f,
        {"range_queries", "index_selection"},
        {}
    };

    // Cross-domain
    nodes["optimization"] = {
        "optimization",
        "System-Wide Optimization",
        "HYBRID",
        0.8f,
        20.0f,
        {"paging", "query_optimization"},
        {}
    };
}

bool PrerequisiteDAG::arePrerequisitesMet(const std::string& competencyId,
                                           const std::map<std::string, float>& masteryScores) const {
    auto it = nodes.find(competencyId);
    if (it == nodes.end()) return false;

    const CompetencyNode& node = it->second;
    for (const auto& prereqId : node.prerequisites) {
        auto masteryIt = masteryScores.find(prereqId);
        if (masteryIt == masteryScores.end() || masteryIt->second < masteryThreshold) {
            return false;
        }
    }
    return true;
}

std::vector<std::string> PrerequisiteDAG::topologicalSort(const std::set<std::string>& nodeSet) const {
    std::vector<std::string> result;
    std::set<std::string> visited;
    std::set<std::string> visiting;

    std::function<void(const std::string&)> dfs = [&](const std::string& nodeId) {
        if (visited.count(nodeId)) return;
        if (visiting.count(nodeId)) return; // cycle
        visiting.insert(nodeId);
        auto it = nodes.find(nodeId);
        if (it != nodes.end()) {
            for (const auto& prereqId : it->second.prerequisites) {
                if (nodeSet.count(prereqId)) {
                    dfs(prereqId);
                }
            }
        }
        visiting.erase(nodeId);
        visited.insert(nodeId);
        result.push_back(nodeId);
    };

    for (const auto& nodeId : nodeSet) {
        dfs(nodeId);
    }
    return result;
}

std::string PrerequisiteDAG::getNextCompetency(const std::map<std::string, float>& masteryScores,
                                                const std::string& preferredDomain) const {
    std::vector<std::string> viable;
    for (const auto& [nodeId, node] : nodes) {
        auto masteryIt = masteryScores.find(nodeId);
        if (masteryIt != masteryScores.end() && masteryIt->second >= masteryThreshold)
            continue;
        if (arePrerequisitesMet(nodeId, masteryScores)) {
            if (preferredDomain.empty() || node.domain == preferredDomain) {
                viable.push_back(nodeId);
            }
        }
    }
    std::sort(viable.begin(), viable.end(), [this](const std::string& a, const std::string& b) {
        return nodes.at(a).difficulty < nodes.at(b).difficulty;
    });
    return viable.empty() ? "" : viable[0];
}

std::vector<std::string> PrerequisiteDAG::getCompetenciesAtLevel(int level) {
    std::vector<std::string> result;
    if (level == 0) {
        for (const auto& [id, node] : nodes) {
            if (node.prerequisites.empty()) {
                result.push_back(id);
            }
        }
        return result;
    }
    std::set<std::string> prevLevel(getCompetenciesAtLevel(level - 1).begin(),
                                    getCompetenciesAtLevel(level - 1).end());
    for (const auto& [id, node] : nodes) {
        bool allPrev = true;
        for (const auto& pid : node.prerequisites) {
            if (!prevLevel.count(pid)) {
                allPrev = false;
                break;
            }
        }
        if (allPrev && !node.prerequisites.empty()) {
            result.push_back(id);
        }
    }
    return result;
}

std::vector<std::string> PrerequisiteDAG::getPathToCompetency(
    const std::string& targetId,
    const std::map<std::string, float>& masteryScores) {
    std::vector<std::string> path;
    auto it = nodes.find(targetId);
    if (it == nodes.end()) return path;
    std::function<void(const std::string&)> buildPath = [&](const std::string& nodeId) {
        auto it2 = nodes.find(nodeId);
        if (it2 == nodes.end()) return;
        auto& node = it2->second;
        auto masteryIt = masteryScores.find(nodeId);
        if (masteryIt == masteryScores.end() || masteryIt->second < masteryThreshold) {
            path.push_back(nodeId);
        }
        for (const auto& pid : node.prerequisites) {
            buildPath(pid);
        }
    };
    buildPath(targetId);
    std::set<std::string> pathSet(path.begin(), path.end());
    path = topologicalSort(pathSet);
    return path;
}

bool PrerequisiteDAG::canUnlock(const std::string& competencyId,
                                 const std::map<std::string, float>& masteryScores) const {
    return arePrerequisitesMet(competencyId, masteryScores);
}

std::vector<std::string> PrerequisiteDAG::getPrerequisites(const std::string& competencyId) const {
    auto it = nodes.find(competencyId);
    if (it == nodes.end()) return {};
    return it->second.prerequisites;
}

std::vector<std::string> PrerequisiteDAG::getUnlocks(const std::string& competencyId) const {
    auto it = nodes.find(competencyId);
    if (it == nodes.end()) return {};
    return it->second.unlocks;
}

float PrerequisiteDAG::getDifficulty(const std::string& competencyId) const {
    auto it = nodes.find(competencyId);
    if (it == nodes.end()) return 0.5f;
    return it->second.difficulty;
}

std::string PrerequisiteDAG::toJson() const {
    // JSON serialization; just for MVP, will be improved for production grade.. later (Hopefully lol)
    std::ostringstream out;
    out << "{\"nodes\":[";
    bool firstNode = true;
    for (const auto& [id, node] : nodes) {
        if (!firstNode) out << ",";
        firstNode = false;
        out << "{\"id\":\"" << node.id << "\"";
        out << ",\"name\":\"" << node.name << "\"";
        out << ",\"domain\":\"" << node.domain << "\"";
        out << ",\"difficulty\":" << node.difficulty;
        out << ",\"estimatedTime\":" << node.estimatedTimeMinutes;
        out << ",\"prerequisites\":[";
        for (size_t i = 0; i < node.prerequisites.size(); ++i) {
            if (i) out << ",";
            out << "\"" << node.prerequisites[i] << "\"";
        }
        out << "]";
        out << ",\"unlocks\":[";
        for (size_t i = 0; i < node.unlocks.size(); ++i) {
            if (i) out << ",";
            out << "\"" << node.unlocks[i] << "\"";
        }
        out << "]";
        out << "}";
    }
    out << "]}";
    return out.str();
}
