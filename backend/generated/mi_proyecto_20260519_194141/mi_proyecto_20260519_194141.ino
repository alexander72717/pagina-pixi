#include "include/RobotHAL.h"

RobotHAL robot;

void setup() {
  robot.begin();
}

void loop() {
for (int i = 0; i < 10; i++) {
    robot.encenderLed();
    robot.esperar(1);
    robot.apagarLed();
    robot.esperar(1);
    robot.encenderLedVerde();
    robot.esperar(1);
}
}
