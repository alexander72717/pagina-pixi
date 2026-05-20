#include "include/RobotHAL.h"

RobotHAL robot;

void setup() {
  robot.begin();
}

void loop() {
for (int i = 0; i < 10; i++) {
    robot.encenderLedAzul();
    robot.esperar(500);
    robot.encenderLedVerde();
    robot.esperar(500);
    robot.encenderLed();
}
}
