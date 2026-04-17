#pragma once

#include <Arduino.h>

class RobotHAL {
 public:
  void begin() {
    Serial.begin(115200);
    delay(200);

#ifdef LED_BUILTIN
    pinMode(LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN, LOW);
#endif
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

  void encenderLed() {
#ifdef LED_BUILTIN
    digitalWrite(LED_BUILTIN, HIGH);
    Serial.println("LED encendido");
#else
    Serial.println("LED_BUILTIN no esta definido en esta placa");
#endif
  }

  void apagarLed() {
#ifdef LED_BUILTIN
    digitalWrite(LED_BUILTIN, LOW);
    Serial.println("LED apagado");
#else
    Serial.println("LED_BUILTIN no esta definido en esta placa");
#endif
  }

  void esperar(int milisegundos) {
    delay(milisegundos);
  }
};
