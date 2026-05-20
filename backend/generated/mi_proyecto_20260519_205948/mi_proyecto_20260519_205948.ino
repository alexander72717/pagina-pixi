#include "include/RobotHAL.h"

RobotHAL robot;

void setup() {
  robot.begin();
}

void loop() {
for (int i = 0; i < 10; i++) {
    robot.encenderLed();
    robot.esperar(3000);
    robot.encenderLedVerde();
    robot.esperar(500);
}
}
