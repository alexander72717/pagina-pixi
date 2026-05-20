#pragma once

#include <Arduino.h>
#include "esp32-hal-rgb-led.h"
#include "BoardConfig.h"

static const rgb_led_color_order_t PIXI_ONBOARD_RGB_ORDER =
#if defined(PIXI_LED_ORDER_GRB)
    LED_COLOR_ORDER_GRB;
#elif defined(PIXI_LED_ORDER_BRG)
    LED_COLOR_ORDER_BRG;
#elif defined(PIXI_LED_ORDER_RBG)
    LED_COLOR_ORDER_RBG;
#elif defined(PIXI_LED_ORDER_GBR)
    LED_COLOR_ORDER_GBR;
#elif defined(PIXI_LED_ORDER_BGR)
    LED_COLOR_ORDER_BGR;
#else
    LED_COLOR_ORDER_RGB;
#endif

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
    setLedColor(255, 0, 0, "LED encendido en rojo");
  }

  void apagarLed() {
    setLedColor(0, 0, 0, "LED apagado");
  }

  void encenderLedVerde() {
    setLedColor(0, 255, 0, "LED encendido en verde");
  }

  void encenderLedAzul() {
    setLedColor(0, 0, 255, "LED encendido en azul");
  }

  void encenderLedBlanco() {
    setLedColor(255, 255, 255, "LED encendido en blanco");
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

 private:
  void setLedColor(uint8_t red, uint8_t green, uint8_t blue, const char *message) {
#if defined(PIXI_LED_MODE_RGB)
    rgbLedWriteOrdered(PIXI_LED_PIN, PIXI_ONBOARD_RGB_ORDER, red, green, blue);
    Serial.println(message);
#elif defined(PIXI_LED_MODE_DIGITAL)
    bool ledOn = red > 0 || green > 0 || blue > 0;
    int activeValue = PIXI_LED_ACTIVE_HIGH ? HIGH : LOW;
    int inactiveValue = PIXI_LED_ACTIVE_HIGH ? LOW : HIGH;
    pinMode(PIXI_LED_PIN, OUTPUT);
    digitalWrite(PIXI_LED_PIN, ledOn ? activeValue : inactiveValue);
    Serial.println(message);
#else
    Serial.println("No hay configuracion de LED para esta placa");
#endif
  }
};
