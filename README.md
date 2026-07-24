# Pixi Blocks Lab

Pixi Blocks Lab es una plataforma educativa para programar robots con bloques visuales y placas `ESP32`.

La idea del proyecto es simple:

1. crear un programa con bloques
2. convertirlo en codigo para la placa
3. compilarlo
4. cargarlo en el robot

La placa objetivo principal del producto es:

- `ESP32-S3 Zero`

## Que problema quiere resolver

Hoy programar una placa para robotica educativa suele exigir demasiadas cosas tecnicas:

- instalar herramientas
- aprender configuraciones de compilacion
- entender puertos y placas
- escribir codigo desde cero

Pixi Blocks Lab quiere reducir esa friccion para que la experiencia se acerque mas a herramientas educativas tipo arrastrar, conectar y programar.

## Que hace hoy

El proyecto ya puede:

- mostrar una interfaz visual con `Blockly`
- generar codigo `C++`
- compilar sketches para `ESP32`
- subir programas por USB en entorno local
- controlar el LED de la placa desde bloques
- guardar y cargar proyectos en el navegador

## Como esta organizado

Hoy el sistema se divide en dos piezas principales:

### 1. Web App

Es la interfaz que ve la persona usuaria.

Sirve para:

- arrastrar bloques
- ver el codigo generado
- guardar proyectos
- pedir compilacion

Esta web puede publicarse en internet, por ejemplo con `Render`, o en un servidor propio con `CasaOS`.

### 2. Compiler Service

Es el servicio que hace el trabajo de compilacion.

Sirve para:

- recibir el codigo generado
- crear el sketch
- compilar con `arduino-cli`
- opcionalmente subir por USB cuando corre en una maquina local

## Como funciona la arquitectura hoy

La arquitectura actual ya puede funcionar de dos formas.

### Prototipo anterior con Render

- `Render` publica la web
- una PC local puede correr el Compiler Service
- la web puede pedirle compilacion a ese servicio

Ese flujo sirvio para:

- avanzar sin pagar todavia un servidor de compilacion potente
- probar la separacion entre interfaz y compilacion
- seguir construyendo el producto con una base mas escalable

### Migracion a servidor propio

Ahora tambien existe un flujo recomendado para servidor propio:

- tu servidor Ubuntu/CasaOS publica la web
- el mismo servidor compila usando `arduino-cli`
- el navegador del usuario carga el firmware en la placa conectada a su equipo

Este flujo se acerca mas a la arquitectura final porque ya no depende de Render ni de tener PowerShell abierto en tu PC principal.

## Importante: compilacion y carga no son lo mismo

Este punto es clave para entender el proyecto:

- la compilacion si puede vivir en un servidor
- la carga por USB depende del equipo que tiene conectada la placa

Por eso, a largo plazo, la arquitectura correcta del producto es:

- web publica
- compilacion remota
- carga local desde el equipo del usuario

Hoy esa arquitectura final todavia esta en construccion.

## Que ya se logro validar

El proyecto ya valido varias partes importantes:

- compilacion real para `ESP32-S3 Zero`
- subida real por USB en entorno local
- comunicacion entre la web publica y un compilador local
- compilacion desde un PC y carga local desde otro PC usando la web
- control del LED desde bloques
- base inicial para hardware del robot

## Cambio importante en esta fase

En esta etapa empezamos a separar mejor el concepto de `compilar` del de `subir`.

Ahora el backend puede devolver:

- `artifact_id`
- `artifact_files`
- `artifact_urls`

Eso significa que la compilacion remota ya puede dejar artefactos descargables, lo cual es un paso importante hacia el modelo final donde el servidor compila y el cliente decide como cargar el resultado.

Tambien ya se valido el flujo:

1. abrir la web en un equipo cliente
2. pedir compilacion al PC compilador
3. recibir el firmware compilado
4. cargar el firmware en la placa conectada al equipo cliente

Ese flujo es importante porque se acerca mucho mas al comportamiento final del producto.

## Flujo recomendado hoy

### Opcion 1. Una sola PC

La misma maquina hace todo:

- abre la web
- compila
- tiene conectada la placa
- sube el programa

Este sigue siendo el flujo mas estable para desarrollo y pruebas rapidas.

### Opcion 2. Web publica + compilador local

La web vive en `Render`, pero la compilacion la hace tu PC.

Este flujo sirve para:

- validar la arquitectura distribuida
- probar el sistema desde otros equipos
- seguir evolucionando la API de compilacion

El flujo recomendado en esta opcion es:

1. pulsar `Compilar`
2. esperar el resultado de compilacion
3. conectar la placa al equipo cliente
4. pulsar `Cargar en esta placa`

El boton avanzado `Compilar y subir desde el compilador` queda solo para pruebas donde la placa esta conectada directamente a la maquina compiladora.

## Estado de la placa principal

La `ESP32-S3 Zero` ya esta integrada como placa objetivo del proyecto.

Actualmente ya se confirmo:

- compilacion real
- subida por USB
- control del LED RGB

Tambien ya existe configuracion inicial para:

- motores
- boton
- I2C
- OLED

## Sobre la ESP32-C3 Super Mini

Existe un perfil para `ESP32-C3 Super Mini`, pero debe entenderse solo como soporte temporal de desarrollo.

No es la placa objetivo del producto final.

## Como iniciar el compilador local

Abre una terminal en:

[C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\backend](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\backend)

Y ejecuta:

```powershell
.\.venv\Scripts\python.exe app.py
```

## Como iniciar el compilador local en HTTPS

Si quieres que la web publicada en `Render` pueda intentar hablar con tu compilador local, usa HTTPS:

```powershell
$env:PIXI_FORCE_LOCAL="true"; $env:PIXI_USE_HTTPS="true"; $env:PIXI_LOCAL_HOST="localhost"; $env:PORT="5443"; .\.venv\Scripts\python.exe app.py
```

Luego abre:

[https://localhost:5443/api/health](https://localhost:5443/api/health)

Y acepta el certificado local si el navegador lo pide.

## Como usarlo desde otro equipo de tu red

Si quieres que otro PC use tu compilador temporal:

1. arranca el compilador en tu PC principal
2. mira la IP local que muestra la terminal
3. desde el otro equipo abre esa ruta `/api/health`
4. usa esa misma direccion como `compiler endpoint`

Importante:

- ambos equipos deben estar en la misma red
- la IP puede cambiar entre casa y trabajo
- por eso el endpoint remoto puede necesitar actualizarse

En el equipo cliente, despues de compilar, el camino normal es usar `Cargar en esta placa`. Esa accion usa el navegador del cliente para acceder al USB local.

## Documentacion de arquitectura

La explicacion completa de la arquitectura y del plan a futuro esta aqui:

- [docs/ARCHITECTURE_ROADMAP.md](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\docs\ARCHITECTURE_ROADMAP.md)
- [docs/SELF_HOSTING_CASAOS.md](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\docs\SELF_HOSTING_CASAOS.md)

Ese documento responde cosas como:

- que es temporal y que es definitivo
- por que la compilacion y la carga deben separarse
- que cambios queremos hacer despues
- como queremos llegar a una experiencia mas plug and play

## Estructura general del proyecto

```text
pagina pixi/
|-- backend/
|-- diagnostics/
|-- docs/
|-- firmware/
|-- frontend/
|-- casaos-compose.yml
|-- Dockerfile
`-- render.yaml
```

Archivos importantes:

- [backend/app.py](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\backend\app.py)
- [backend/compiler.py](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\backend\compiler.py)
- [frontend/index.html](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\frontend\index.html)
- [frontend/app.js](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\frontend\app.js)
- [firmware/include/RobotHAL.h](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\firmware\include\RobotHAL.h)

## Resumen

Pixi Blocks Lab ya tiene una base real:

- interfaz web
- generacion de codigo
- compilacion
- carga local
- separacion inicial de servicios

Y lo mas importante:

la arquitectura ya se esta ordenando para que el prototipo actual pueda evolucionar hacia un producto mucho mas simple para el usuario final.
