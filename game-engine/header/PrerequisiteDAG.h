#ifndef PREREQUISITE_DAG_H
#define PREREQUISITE_DAG_H

#include <string>
#include <map>
#include <vector>

// Simple acyclic graph for keeping track of skill prerequisites.
//will add more methods as more learning paths are added

struct CompetencyNode {
    std::string id;
    std::string name;
    std::vector<std::string> prerequisites;
};

class PrerequisiteDAG {
public:
    PrerequisiteDAG();

    // returns next competency id that has all prerequisites satisfied (Basically the next thing the player should learn)
    // emptry string if all competencies are fully mastered or no valid next competency is present
    std::string getNextCompetency(const std::map<std::string, float>& masteryScores) const;

private:
    std::map<std::string, CompetencyNode> nodes;
};

#endif // PREREQUISITE_DAG_H
