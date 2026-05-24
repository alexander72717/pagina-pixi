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

    configurarMotores();
    configurarBoton();
    apagarLed();
  }

  void moverAdelante(int velocidad = 180) {
    moverMotor(PIXI_MOTOR_LEFT_FORWARD_PIN, PIXI_MOTOR_LEFT_BACKWARD_PIN, true);
    moverMotor(PIXI_MOTOR_RIGHT_FORWARD_PIN, PIXI_MOTOR_RIGHT_BACKWARD_PIN, true);
    Serial.printf("Mover adelante, velocidad solicitada=%d\n", velocidad);
  }

  void girarIzquierda(int velocidad = 180) {
    moverMotor(PIXI_MOTOR_LEFT_FORWARD_PIN, PIXI_MOTOR_LEFT_BACKWARD_PIN, false);
    moverMotor(PIXI_MOTOR_RIGHT_FORWARD_PIN, PIXI_MOTOR_RIGHT_BACKWARD_PIN, true);
    Serial.printf("Girar izquierda, velocidad solicitada=%d\n", velocidad);
  }

  void detenerMotores() {
    detenerMotor(PIXI_MOTOR_LEFT_FORWARD_PIN, PIXI_MOTOR_LEFT_BACKWARD_PIN);
    detenerMotor(PIXI_MOTOR_RIGHT_FORWARD_PIN, PIXI_MOTOR_RIGHT_BACKWARD_PIN);
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
  void configurarMotores() {
    configurarPinSalida(PIXI_MOTOR_LEFT_FORWARD_PIN);
    configurarPinSalida(PIXI_MOTOR_LEFT_BACKWARD_PIN);
    configurarPinSalida(PIXI_MOTOR_RIGHT_FORWARD_PIN);
    configurarPinSalida(PIXI_MOTOR_RIGHT_BACKWARD_PIN);
    detenerMotores();
  }

  void configurarBoton() {
#if PIXI_BUTTON_PIN >= 0
    pinMode(PIXI_BUTTON_PIN, INPUT_PULLUP);
    Serial.printf("Boton configurado en GPIO %d\n", PIXI_BUTTON_PIN);
#endif
  }

  void configurarPinSalida(int pin) {
    if (pin < 0) {
      return;
    }

    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
  }

  void moverMotor(int pinForward, int pinBackward, bool forward) {
    if (pinForward < 0 || pinBackward < 0) {
      return;
    }

    digitalWrite(pinForward, forward ? HIGH : LOW);
    digitalWrite(pinBackward, forward ? LOW : HIGH);
  }

  void detenerMotor(int pinForward, int pinBackward) {
    if (pinForward < 0 || pinBackward < 0) {
      return;
    }

    digitalWrite(pinForward, LOW);
    digitalWrite(pinBackward, LOW);
  }

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
