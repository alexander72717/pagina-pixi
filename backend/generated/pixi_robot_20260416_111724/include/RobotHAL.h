#pragma once

#include <Arduino.h>
#include "esp32-hal-rgb-led.h"

static const uint8_t PIXI_ONBOARD_RGB_PIN = 21;

class RobotHAL {
 public:
  void begin() {
    Serial.begin(115200);
    delay(200);

    apagarLed();
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
    rgbLedWrite(PIXI_ONBOARD_RGB_PIN, 255, 0, 0);
    Serial.println("LED RGB encendido en rojo");
  }

  void apagarLed() {
    rgbLedWrite(PIXI_ONBOARD_RGB_PIN, 0, 0, 0);
    Serial.println("LED RGB apagado");
  }

  void encenderLedVerde() {
    rgbLedWrite(PIXI_ONBOARD_RGB_PIN, 0, 255, 0);
    Serial.println("LED RGB encendido en verde");
  }

  void encenderLedAzul() {
    rgbLedWrite(PIXI_ONBOARD_RGB_PIN, 0, 0, 255);
    Serial.println("LED RGB encendido en azul");
  }

  void encenderLedBlanco() {
    rgbLedWrite(PIXI_ONBOARD_RGB_PIN, 255, 255, 255);
    Serial.println("LED RGB encendido en blanco");
  }

  void encenderLedDigitalCompat() {
#ifdef LED_BUILTIN
    digitalWrite(LED_BUILTIN, HIGH);
    Serial.println("LED encendido");
#else
    Serial.println("LED_BUILTIN no esta definido en esta placa");
#endif
  }

  void esperar(int milisegundos) {
    delay(milisegundos);
  }
};
