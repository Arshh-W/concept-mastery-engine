"""
port for PIDController.h

Adjusts simulation entropy or randomness(related to the difficulty) to maintain the target success rate.
Higher entropy = harder / more randomness in the simulation.

"""


class PIDController:
    def __init__(
        self,
        kp: float = 0.5,
        ki: float = 0.1,
        kd: float = 0.05,
        setpoint: float = 0.7,       # target success rate
        output_min: float = -0.2,
        output_max: float = 0.2,
    ):
        self.kp         = kp
        self.ki         = ki
        self.kd         = kd
        self.setpoint   = setpoint
        self.output_min = output_min
        self.output_max = output_max
        self._integral  = 0.0
        self._last_error = 0.0

    def update(self, current_performance: float, dt: float = 1.0) -> float:
        """
        Returns the entropy adjustment value.
        Positive → increase difficulty (user is doing quite well)
        Negative → decrease difficulty (user is welp not doing quite well lol! )
        """
        error = self.setpoint - current_performance

        # Proportional
        p = self.kp * error

        # Integral with anti-windup
        self._integral = max(-1.0, min(1.0, self._integral + error * dt))
        i = self.ki * self._integral

        # Derivative
        d = self.kd * ((error - self._last_error) / dt) if dt > 0 else 0.0
        self._last_error = error

        output = p + i + d
        return max(self.output_min, min(self.output_max, output))

    def reset(self):
        self._integral   = 0.0
        self._last_error = 0.0

    @property
    def setpoint(self):
        return self._setpoint

    @setpoint.setter
    def setpoint(self, value: float):
        self._setpoint = max(0.0, min(1.0, value))