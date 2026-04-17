#include "include/RobotHAL.h"

RobotHAL robot;

void setup() {
  robot.begin();
}

void loop() {
robot.encenderLed();
robot.esperar(1000);
robot.apagarLed();
robot.esperar(1000);
}
