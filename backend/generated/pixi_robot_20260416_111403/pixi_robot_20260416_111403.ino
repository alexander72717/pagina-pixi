#include "include/RobotHAL.h"

RobotHAL robot;

void setup() {
  robot.begin();
}

void loop() {
robot.encenderLed();
robot.esperar(2000);
robot.apagarLed();
}
