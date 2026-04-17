#pragma once

#include <Arduino.h>

class RobotHAL {
 public:
  void begin() {
    // Aqui luego configuraremos pines reales del robot.
    // La idea es que los bloques llamen funciones simples y no pinMode() directo.
    Serial.begin(115200);
    delay(200);
  }

  void moverAdelante(int velocidad = 180) {
    Serial.printf("Mover adelante, velocidad=%d\n", velocidad);
  }

  void girarIzquierda(int velocidad = 180) {
    Serial.printf("Girar izquierda, velocidad=%d\n", velocidad);
  }

  void detenerMotores() {
    Serial.println("Detener motores");
  }

  int leerDistanciaCm() {
    // Valor de prueba para el primer prototipo.
    return 20;
  }
};
