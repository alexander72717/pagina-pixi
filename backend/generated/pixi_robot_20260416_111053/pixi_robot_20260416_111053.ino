#include "include/RobotHAL.h"

RobotHAL robot;

void setup() {
  robot.begin();
}

void loop() {
for (int i = 0; i < 0; i++) {
    robot.encenderLed();
    robot.esperar(2000);
    robot.apagarLed();
}
}
