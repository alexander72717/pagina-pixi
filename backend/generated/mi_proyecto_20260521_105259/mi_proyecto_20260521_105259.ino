#include "include/RobotHAL.h"

RobotHAL robot;

void setup() {
  robot.begin();
}

void loop() {
robot.encenderLed();
robot.esperar(500);
robot.encenderLedAzul();
robot.esperar(500);
}
