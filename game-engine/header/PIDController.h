#ifndef PID_CONTROLLER_H
#define PID_CONTROLLER_H

/*
 PIDController.h - Real-Time Difficulty Scaling System 
 here I am Implementing a PID (Proportional-Integral-Derivative) control loop
 to maintain optimal learner flow state by adjusting system randomness. 
 The setpoint is the desired user performance level (e.g., 70% success rate).
 The feedback is actual performance (success rate, response time, etc).
 */

class PIDController {
private:
    float kP;               // Proportional gain
    float kI;               // Integral gain
    float kD;               // Derivative gain
    float setpoint;         // Target success rate (0.0-1.0)
    float integral;         // Accumulated integral error
    float lastError;        // Previous iteration error
    float outputMin;        // Min entropy adjustment (-1.0)
    float outputMax;        // Max entropy adjustment (+1.0)
    
public:
    PIDController(float p = 0.5f, float i = 0.1f, float d = 0.05f, float sp = 0.7f)
        : kP(p), kI(i), kD(d), setpoint(sp), integral(0.0f), lastError(0.0f),
          outputMin(-1.0f), outputMax(1.0f) {}
    
    float calculateOutput(float currentPerformance, float deltaTime = 1.0f) {
        // Error: difference between setpoint and current performance
        float error = setpoint - currentPerformance;
        
        // Proportional term
        float P = kP * error;
        
        // Integral term (with anti-windup)
        integral += error * deltaTime;
        if (integral > 1.0f) integral = 1.0f;
        if (integral < -1.0f) integral = -1.0f;
        float I = kI * integral;
        
        // Derivative term
        float D = 0.0f;
        if (deltaTime > 0) {
            D = kD * (error - lastError) / deltaTime;
        }
        lastError = error;
        
        // Combined output
        float output = P + I + D;
        
        // Clamp to output range
        if (output > outputMax) output = outputMax;
        if (output < outputMin) output = outputMin;
        
        return output;
    }
    
    //adjusting entropy based on the current performance metric
    float getEntropyAdjustment(float currentPerformance, float deltaTime = 1.0f) {
        return calculateOutput(currentPerformance, deltaTime);
    }
    
    void setSetpoint(float sp) {
        setpoint = sp;
    }
    
    void resetIntegral() {
        integral = 0.0f;
        lastError = 0.0f;
    }
    
    float getSetpoint() const { return setpoint; }
    float getIntegral() const { return integral; }
};

#endif // PID_CONTROLLER_H