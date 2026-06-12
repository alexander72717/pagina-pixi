# Pixi Blocks Lab - Arquitectura y hoja de ruta

Este documento describe de forma clara:

- como funciona el sistema hoy
- por que algunas partes son temporales
- cual es la arquitectura objetivo del producto
- que cambios queremos hacer a continuacion

## 1. Vision del producto

La meta final es ofrecer una experiencia muy cercana a herramientas educativas tipo VEX:

1. abrir la pagina
2. conectar la `ESP32-S3 Zero`
3. arrastrar bloques
4. compilar
5. cargar el programa en la placa

Idealmente, el usuario final no deberia tener que:

- escribir IPs
- elegir puertos manualmente
- cambiar `FQBN`
- abrir PowerShell
- instalar herramientas complejas de desarrollo

## 2. Arquitectura objetivo

La arquitectura final deseada es esta:

```text
Usuario
  |
  v
Web publica (Blockly)
  |
  v
Servicio remoto de compilacion
  |
  v
Artefacto compilado (.bin)
  |
  v
Carga local desde el equipo del usuario
```

La idea central es separar claramente:

- interfaz web
- compilacion
- carga a la placa

## 3. Por que la carga no puede vivir completamente en el servidor

Aunque la compilacion si puede ejecutarse en un servidor remoto, el acceso al USB de la placa no.

Un servidor en la nube:

- no ve el puerto `COM` del usuario
- no ve `Web Serial` del navegador del usuario
- no puede tocar directamente la placa conectada al cliente

Por eso el modelo final correcto es:

- el servidor compila
- el equipo cliente hace la carga

## 4. Arquitectura actual

Hoy el proyecto funciona con una arquitectura intermedia:

```text
Render -> publica la web
PC principal -> corre el Compiler Service
Cliente remoto -> usa la web y manda a compilar al Compiler Service
```

Esta arquitectura actual sirve para:

- validar la separacion entre web y compilacion
- evitar pagar un servidor de compilacion potente desde el inicio
- seguir desarrollando el producto mientras se define la experiencia final

## 5. Que ya demostramos

El sistema ya demostro que puede:

- publicar la interfaz en `Render`
- generar codigo C++ desde Blockly
- compilar para `ESP32-S3 Zero`
- subir por USB cuando la placa esta en la maquina que corre el compilador
- exponer un compilador local por HTTPS
- recibir solicitudes desde otros equipos de la misma red
- compilar en una maquina y cargar el firmware desde el navegador de otra maquina

Eso significa que la parte de "compilacion como servicio" ya quedo probada.

## 6. Limite del prototipo actual

El flujo actual todavia no representa la experiencia final del producto.

Limite principal:

- el flujo distribuido ya funciona como prueba tecnica
- todavia hay que simplificarlo para que no dependa de explicar endpoints, certificados o direcciones IP

Eso es util para pruebas tecnicas, pero todavia no es la experiencia plug and play que queremos.

## 7. Cambio de direccion acordado

A partir de este punto, la orientacion del proyecto cambia ligeramente:

- la compilacion remota se mantiene como pieza principal
- la carga por USB debe diseñarse como una accion local del cliente

En otras palabras:

- `compile` debe pensarse como servicio remoto
- `flash` debe pensarse como servicio local del equipo del usuario

## 8. Cambio implementado en esta fase

En esta fase ya dejamos un paso concreto hacia ese modelo:

- el backend ahora devuelve un `artifact_id`
- tambien devuelve `artifact_files`
- y expone `artifact_urls` descargables

Eso prepara el terreno para que la compilacion remota entregue resultados utilizables por el cliente sin depender de una subida inmediata por `COM`.

## 9. Arquitectura transitoria recomendada

Mientras no exista aun un servidor de compilacion dedicado, la recomendacion es esta:

### Modo A - Desarrollo en una sola maquina

- misma PC para web, compilacion y placa
- sirve para crear bloques y validar hardware rapido

### Modo B - Simulacion de servidor temporal

- `Render` publica la web
- una PC local hace de servidor de compilacion
- otros equipos pueden pedir compilacion

Este modo sirve para probar la arquitectura distribuida, no para representar todavia el producto final.

## 10. Hoja de ruta recomendada

### Fase 1 - Simplificacion de uso

Objetivo:

- centrar la interfaz en `ESP32-S3 Zero`
- esconder configuracion tecnica en modo avanzado
- mejorar mensajes y autodeteccion

Estado:

- en progreso

### Fase 2 - Compilacion remota clara

Objetivo:

- tratar el backend como servicio de compilacion remoto
- entregar artefactos descargables
- dejar de mezclar tanto "compilar" con "subir"

Estado:

- iniciada

### Fase 3 - Flujo de carga local

Objetivo:

- estudiar y preparar una carga local desde el equipo cliente
- preferiblemente orientada a navegador y `ESP32-S3 Zero`

Estado:

- iniciada y validada como prueba tecnica

### Fase 4 - Servidor de compilacion real

Objetivo:

- mover la compilacion desde la PC temporal a infraestructura dedicada
- mantener la misma API y la misma web

Estado:

- pendiente

## 11. Cambios que queremos hacer a continuacion

Los siguientes cambios deseados quedan oficialmente anotados asi:

1. reducir todavia mas la configuracion visible en modo normal
2. mejorar la deteccion y seleccion automatica del compiler endpoint
3. mejorar los mensajes de error del flujo `Cargar en esta placa`
4. preparar un backend que pueda migrar a un servidor real sin rehacer la API
5. convertir el flujo probado en una experiencia mas cercana a plug and play

## 12. Decision de producto importante

La placa objetivo del producto sigue siendo:

- `ESP32-S3 Zero`

La `ESP32-C3 Super Mini` se mantiene solo como placa temporal de desarrollo y pruebas.

## 13. Conclusiones

No estamos rehaciendo el proyecto: estamos ordenandolo para que el prototipo actual no se convierta en deuda tecnica.

La logica que queremos preservar es esta:

- la web debe seguir siendo publica
- la compilacion debe terminar viviendo en servidor
- la carga a la placa debe resolverse del lado del usuario

Ese es el camino mas coherente con una experiencia final simple.
