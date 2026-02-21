#ifndef PREREQUISITE_DAG_H
#define PREREQUISITE_DAG_H

#include <string>
#include <map>
#include <vector>
#include <set>
#include <algorithm>

// Directed acyclic graph representing skill/competency prerequisites for
// the learning engine.  In later iterations this will be populated from a
// database, but for now the default graph is built in code.

struct CompetencyNode {
    std::string id;                      // unique identifier
    std::string name;                    // human-readable name
    std::string domain;                  // e.g. "OS_Memory" or "DBMS"
    float difficulty;                    // 0.0 (easy) to 1.0 (hard)
    float estimatedTimeMinutes;
    std::vector<std::string> prerequisites;
    std::vector<std::string> unlocks;
};

class PrerequisiteDAG {
private:
    std::map<std::string, CompetencyNode> nodes;
    float masteryThreshold;              // default 0.95 (95% mastery)

    void initializeDefaultGraph();
    bool arePrerequisitesMet(const std::string& competencyId,
                              const std::map<std::string, float>& masteryScores) const;
    std::vector<std::string> topologicalSort(const std::set<std::string>& nodeSet) const;

public:
    PrerequisiteDAG(float threshold = 0.95f);

    std::string getNextCompetency(const std::map<std::string, float>& masteryScores,
                                  const std::string& preferredDomain = "") const;

    std::vector<std::string> getCompetenciesAtLevel(int level);
    std::vector<std::string> getPathToCompetency(
        const std::string& targetId,
        const std::map<std::string, float>& masteryScores);

    bool canUnlock(const std::string& competencyId,
                   const std::map<std::string, float>& masteryScores) const;
    std::vector<std::string> getPrerequisites(const std::string& competencyId) const;
    std::vector<std::string> getUnlocks(const std::string& competencyId) const;
    float getDifficulty(const std::string& competencyId) const;

    std::string toJson() const;
};


#endif // PREREQUISITE_DAG_H
