#ifndef EVENT_SYSTEM_H
#define EVENT_SYSTEM_H

#include <string>
#include <vector>
#include <functional>
#include <map>
#include <json/json.h>

/*
 EventSystem.h - Event-Driven Architecture for our main Simulation Core
 To implement a publish-subscribe pattern to decouple simulation components and 
 enable synced communication with our Flask backend.
 */

enum class EventType {
    // Memory Events
    MEMORY_ALLOCATION_REQUEST,
    MEMORY_ALLOCATION_SUCCESS,
    MEMORY_ALLOCATION_FAILURE,
    MEMORY_DEALLOCATION,
    MEMORY_FRAGMENTATION_DETECTED,
    MEMORY_COMPACTION_TRIGGERED,
    
    // DBMS Events
    QUERY_EXECUTION_START,
    QUERY_EXECUTION_COMPLETE,
    INDEX_INSERTION,
    INDEX_DELETION,
    BTREE_REBALANCE,
    SCAN_OPERATION,
    
    // User Interaction Events
    USER_ACTION,
    USER_OBSERVATION_RECORDED,
    
    // System Events
    DIFFICULTY_ADJUSTED,
    STATE_TRANSITION,
    SIMULATION_ERROR,
    SIMULATION_COMPLETE
};

struct Event {
    EventType type;
    std::string timestamp;
    Json::Value payload;
    
    Event(EventType t, const Json::Value& p) 
        : type(t), payload(p) {
        // Timestamp set by the system when an event was started, for telemetry 
    }
};

class EventListener {
public:
    virtual ~EventListener() = default;
    virtual void handleEvent(const Event& event) = 0;
};

class EventBus {
private:
    std::map<EventType, std::vector<EventListener*>> listeners;
    std::vector<Event> eventLog;
    
public:
    void subscribe(EventType type, EventListener* listener) {
        listeners[type].push_back(listener);
    }
    
    void unsubscribe(EventType type, EventListener* listener) {
        auto& vec = listeners[type];
        vec.erase(std::remove(vec.begin(), vec.end(), listener), vec.end());
    }
    
    void publish(const Event& event) {
        eventLog.push_back(event);
        
        auto it = listeners.find(event.type);
        if (it != listeners.end()) {
            for (auto listener : it->second) {
                listener->handleEvent(event);
            }
        }
    }
    
    const std::vector<Event>& getEventLog() const {
        return eventLog;
    }
    
    void clearLog() {
        eventLog.clear();
    }
};

#endif // EVENT_SYSTEM_H