#include <Arduino.h>
#include "esp32-hal-rgb-led.h"

struct ColorOrderCase {
  rgb_led_color_order_t order;
  const char *name;
};

ColorOrderCase orders[] = {
  {LED_COLOR_ORDER_RGB, "RGB"},
  {LED_COLOR_ORDER_GRB, "GRB"},
  {LED_COLOR_ORDER_BRG, "BRG"},
  {LED_COLOR_ORDER_RBG, "RBG"},
  {LED_COLOR_ORDER_GBR, "GBR"},
  {LED_COLOR_ORDER_BGR, "BGR"},
};

int pinsToTest[] = {21, 48};

void showColor(uint8_t pin, rgb_led_color_order_t order, const char *orderName, uint8_t r, uint8_t g, uint8_t b, const char *colorName) {
  Serial.printf("Probando pin %d, orden %s, color %s\n", pin, orderName, colorName);
  rgbLedWriteOrdered(pin, order, r, g, b);
  delay(1500);
  rgbLedWriteOrdered(pin, order, 0, 0, 0);
  delay(500);
}

void setup() {
  Serial.begin(115200);
  delay(1500);
  Serial.println("Inicio de diagnostico LED RGB para ESP32-S3 Zero");
  Serial.println("Mira la placa y anota en que prueba enciende el LED.");
}

void loop() {
  for (int pin : pinsToTest) {
    for (ColorOrderCase testCase : orders) {
      showColor(pin, testCase.order, testCase.name, 255, 0, 0, "rojo");
      showColor(pin, testCase.order, testCase.name, 0, 255, 0, "verde");
      showColor(pin, testCase.order, testCase.name, 0, 0, 255, "azul");
      delay(1000);
    }
  }

  Serial.println("Ciclo completo terminado. Repite en 3 segundos.");
  delay(3000);
}
