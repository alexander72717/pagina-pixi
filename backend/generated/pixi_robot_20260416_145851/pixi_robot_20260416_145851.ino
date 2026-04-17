#include "include/RobotHAL.h"

RobotHAL robot;

void setup() {
  robot.begin();
}

void loop() {
robot.encenderLed();
robot.esperar(500);
robot.encenderLedVerde();
robot.esperar(500);
robot.encenderLedAzul();
robot.esperar(500);
robot.encenderLedBlanco();
robot.esperar(500);
robot.apagarLed();
robot.esperar(500);
}
