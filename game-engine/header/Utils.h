#ifndef UTILS_H
#define UTILS_H

#include <string>
#include <chrono>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <vector>
#include <cmath>

/*

 Utils.h - Utility Functions and Helpers with common utilities 
 used across the simulation core.
 It is a collection of helper functions for time management, string manipulation, 
 mathematical operations, and other common tasks needed for the game engine.

 */

namespace Utils {
    /*
     Getting current timestamp in default ISO 8601 format, for logging session data and event 
     management. 
     */
    inline std::string getCurrentTimestamp() {
        auto now = std::chrono::system_clock::now();
        auto time = std::chrono::system_clock::to_time_t(now);
        std::stringstream ss;
        ss << std::put_time(std::localtime(&time), "%Y-%m-%dT%H:%M:%SZ");
        return ss.str();
    }

    /*
     Clamping a value between min and max to ensure we stay withint bounds, needed for PID controller 
     */
    template<typename T>
    inline T clamp(T value, T min_val, T max_val) {
        return std::max(min_val, std::min(max_val, value));
    }

    //Linear interpolation between two values
    inline float lerp(float a, float b, float t) {
        return a + (b - a) * clamp(t, 0.0f, 1.0f);
    }

    //Normalizing a value to [0, 1] range
    inline float normalize(float value, float min_val, float max_val) {
        if (max_val == min_val) return 0.5f;
        return clamp((value - min_val) / (max_val - min_val), 0.0f, 1.0f);
    }

    //to calculate exponential moving average, used for smoothing mastery scores and change measurement
    inline float exponentialMovingAverage(float current, float previous, float alpha = 0.3f) {
        return alpha * current + (1.0f - alpha) * previous;
    }

    //simple hash string logic using djb2 algorithm for generating consistent hashes for session ids
    inline unsigned long hash(const std::string& str) {
        unsigned long h = 5381;
        for (char ch : str) {
            h = ((h << 5) + h) + static_cast<unsigned char>(ch);
        }
        return h;
    }

    //for measuring uncertainity in the probability measures of scores we use a shannon entropy function
    inline float shannonEntropy(const std::vector<float>& probabilities) {
        float entropy = 0.0f;
        for (float p : probabilities) {
            if (p > 0) {
                entropy -= p * std::log2(p);
            }
        }
        return entropy;
    }

    //calculating standard devations
    inline float standardDeviation(const std::vector<float>& values) {
        if (values.empty()) return 0.0f;
        float mean = 0.0f;
        for (float v : values) mean += v;
        mean /= values.size();
        float variance = 0.0f;
        for (float v : values) {
            variance += (v - mean) * (v - mean);
        }
        variance /= values.size();
        return std::sqrt(variance);
    }

    //for generating a unique session id based on time and a random component.
    inline std::string generateSessionId() {
        auto now = std::chrono::high_resolution_clock::now();
        auto nanos = std::chrono::duration_cast<std::chrono::nanoseconds>(
            now.time_since_epoch()
        ).count();
        return "session_" + std::to_string(nanos);
    }

    //prefix check for strings 
    inline bool startsWith(const std::string& str, const std::string& prefix) {
        return str.size() >= prefix.size() &&
               str.compare(0, prefix.size(), prefix) == 0;
    }

    //basic suffix check for strings 
    inline bool endsWith(const std::string& str, const std::string& suffix) {
        return str.size() >= suffix.size() &&
               str.compare(str.size() - suffix.size(), suffix.size(), suffix) == 0;
    }

    //simple string split function for parsing inputs or logging data in a better way 
    inline std::vector<std::string> split(const std::string& str, char delimiter) {
        std::vector<std::string> tokens;
        std::stringstream ss(str);
        std::string token;
        while (std::getline(ss, token, delimiter)) {
            tokens.push_back(token);
        }
        return tokens;
    }
}

#endif // UTILS_H
