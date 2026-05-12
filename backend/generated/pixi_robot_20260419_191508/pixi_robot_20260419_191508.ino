#include "include/RobotHAL.h"

RobotHAL robot;

void setup() {
  robot.begin();
}

void loop() {
for (int i = 0; i < 1; i++) {
    robot.encenderLedAzul();
    robot.esperar(1000);
    robot.encenderLed();
    robot.esperar(1000);
}
}
