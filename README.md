# Pixi Blocks Lab

Pixi Blocks Lab es un proyecto educativo para programar placas `ESP32` usando bloques visuales en el navegador.

La idea principal es simple:

- una persona crea un programa con bloques
- la plataforma lo convierte en codigo para la placa
- la placa ejecuta ese programa

Hoy el proyecto ya puede:

- mostrar una interfaz visual con `Blockly`
- generar codigo C++
- compilar para distintas placas `ESP32`
- subir programas por USB a placas compatibles
- controlar el LED RGB integrado desde bloques
- guardar y cargar proyectos en el navegador

## Que hace este proyecto

Este proyecto busca que programar hardware sea mas facil y mas amigable, especialmente para aprendizaje.

En vez de escribir codigo desde cero, la persona puede:

1. arrastrar bloques
2. crear una secuencia logica
3. compilar ese programa
4. cargarlo en la placa

## Como funciona hoy

El sistema esta dividido en dos partes:

### 1. La Web App

Es la parte visual.

Sirve para:

- mostrar los bloques
- ver el codigo generado
- configurar el compilador
- enviar el proyecto a compilar

Esta web puede vivir en internet, por ejemplo en `Render`.

### 2. El Compiler Service

Es la parte que hace el trabajo pesado.

Sirve para:

- recibir el codigo generado
- crear el sketch para Arduino
- compilarlo con `arduino-cli`
- opcionalmente subirlo por USB a la placa

Hoy este servicio corre localmente en tu PC.

## Arquitectura actual

La arquitectura que estamos usando ya esta pensada para crecer sin rehacer todo despues.

Hoy funciona asi:

- `Render` publica la pagina web
- tu PC corre el servicio de compilacion
- la web publica se conecta a tu compilador local

Eso permite:

- tener una pagina online
- seguir usando los recursos de tu PC para compilar
- mantener la posibilidad de subir por USB cuando estas en tu propio equipo

Mas adelante esta misma arquitectura puede evolucionar a:

- web publica en internet
- servicio de compilacion en un servidor con mas memoria
- misma interfaz
- mismo flujo general

## Por que esta arquitectura es importante

No quisimos unir todo en un solo servidor porque eso haria mas dificil escalar el proyecto.

Separar:

- la interfaz
- la compilacion
- y el acceso al hardware

hace que el sistema sea mas flexible.

Por ejemplo:

- hoy el compilador corre en tu PC
- manana puede correr en una Raspberry Pi
- despues puede correr en un servidor mas potente

Sin obligarte a rehacer toda la aplicacion.

## Estado actual del hardware

La placa `ESP32-S3 Zero` ya fue probada con exito.

Actualmente ya se confirmo:

- compilacion real para `ESP32-S3`
- subida real por USB
- control del LED RGB integrado

El LED RGB integrado de esta placa ya funciona desde bloques con estos colores:

- rojo
- verde
- azul
- blanco
- apagado

Tambien dejamos el proyecto preparado para cambiar de placa desde la interfaz.

Hoy existen perfiles iniciales para:

- `ESP32-S3 Zero`
- `ESP32-C3 Super Mini`

Importante:

- la `ESP32-S3 Zero` ya fue probada directamente
- la `ESP32-C3 Super Mini` puede requerir pequenos ajustes de pines segun la version exacta de la placa

## Que significa usar Render

`Render` es el servicio donde la pagina web puede quedar publicada en internet.

Eso significa que la interfaz puede abrirse desde cualquier navegador con una URL publica.

Importante:

- `Render` sirve la pagina
- `Render` no accede al USB de la placa
- el USB sigue siendo algo local del equipo del usuario

En esta etapa, `Render` no hace la compilacion pesada porque el plan gratuito no tiene suficiente memoria para compilar `ESP32` con estabilidad.

Por eso la compilacion sigue corriendo localmente en tu PC.

## Que es el compiler endpoint

En la interfaz existe un campo llamado `compiler endpoint`.

Ese campo le dice a la web:

> "a que servicio le voy a pedir que compile"

Hoy el valor normal es:

```text
http://127.0.0.1:5000
```

Eso apunta al compilador que corre en tu propio PC.

Si la web se abre desde `Render`, el camino mas prometedor para que el navegador permita la conexion es usar el compiler service local en `HTTPS`.

La direccion esperada para esa fase es:

```text
https://localhost:5443
```

## Como usar la plataforma hoy

### Opcion 1: Uso local completo

Usas todo en tu PC.

- la web
- la compilacion
- la subida por USB

### Opcion 2: Web publica + compilacion local

Usas la pagina publicada en `Render`, pero la compilacion ocurre en tu PC.

Eso funciona asi:

1. abres la pagina online
2. la interfaz carga desde `Render`
3. el `compiler endpoint` apunta a tu PC
4. la compilacion se hace localmente

## Como cambiar de placa

La interfaz ahora incluye un selector de placa.

Eso permite cambiar de forma mas limpia entre perfiles compatibles sin editar archivos cada vez.

Cuando cambias la placa:

- la interfaz ajusta el `FQBN`
- el backend genera una configuracion de hardware para esa placa
- el firmware usa ese perfil al compilar

Hoy el flujo recomendado es:

1. elegir la placa en el selector
2. comprobar el `FQBN`
3. compilar
4. hacer una prueba simple de LED antes de conectar mas hardware

## Como iniciar el compilador local

Abre una terminal en:

[`backend`](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\backend)

Y ejecuta:

```powershell
.\.venv\Scripts\python.exe app.py
```

Si todo sale bien, el compiler service queda disponible en:

```text
http://127.0.0.1:5000
```

## Como iniciar el compilador local en HTTPS

Para avanzar en la comunicacion entre la web publica y tu PC, ya dejamos una forma inicial de arrancar el compilador local con `HTTPS`.

Abre una terminal en:

[`backend`](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\backend)

Y ejecuta:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\start_compiler_https.ps1
```

Eso levanta el compiler service en:

```text
https://localhost:5443
```

La primera vez, el navegador puede advertir que el certificado es local o no confiable. En esta fase eso es esperado.

Haz esta prueba:

1. abre `https://localhost:5443/api/health`
2. acepta el certificado local si el navegador lo pide
3. despues vuelve a la web de `Render`
4. deja el `compiler endpoint` en `https://localhost:5443`
5. pulsa `Probar compilador`

## Como usar el compilador desde otro equipo de la misma red

Si la web se abre en otro PC o tablet, `localhost` ya no apunta a tu computador principal.

En ese caso necesitas usar la IP local de la maquina que corre el compilador.

Dejamos un script para eso:

```powershell
.\start_compiler_lan_https.ps1
```

Ese script intenta detectar una IP local y te muestra un endpoint sugerido, por ejemplo:

```text
https://192.168.1.20:5443
```

Luego, desde el otro equipo:

1. abre `https://192.168.1.20:5443/api/health`
2. acepta la advertencia del certificado local si aparece
3. abre la web publica de `Render`
4. en `compiler endpoint` usa esa misma IP
5. pulsa `Probar compilador`

Importante:

- ambos equipos deben estar en la misma red local
- Windows puede pedir permiso de firewall la primera vez
- si la IP cambia, debes actualizar el `compiler endpoint`

## Como usar la web publicada

1. abre la URL publica de tu proyecto en `Render`
2. en el campo `compiler endpoint` deja:

```text
https://localhost:5443
```

3. pulsa `Probar compilador`
4. si todo esta bien, ya puedes compilar

## Lo que ya se puede hacer en Blockly

Actualmente ya existen bloques para:

- encender LED rojo
- encender LED verde
- encender LED azul
- encender LED blanco
- apagar LED
- esperar
- repetir
- condiciones simples
- guardar proyecto
- cargar proyecto

## Limitaciones actuales

Este proyecto ya funciona, pero sigue siendo un prototipo.

Eso significa que todavia faltan cosas como:

- mas bloques de hardware
- mejor experiencia para usuarios no tecnicos
- una solucion final de compilacion remota plug and play
- mas pruebas en otros equipos

## Objetivo de las siguientes fases

La meta no es solo que funcione hoy, sino que el proyecto pueda crecer sin romperse.

Los siguientes pasos recomendados son:

1. mejorar la documentacion para usuarios finales
2. seguir ampliando bloques utiles
3. hacer mas clara la separacion entre Web App y Compiler Service
4. preparar el camino para una compilacion remota real en el futuro
5. mejorar la experiencia de uso para que sea mas cercana a "plug and play"

## Seccion tecnica corta

Estructura principal del proyecto:

```text
pagina pixi/
├── backend/
├── firmware/
├── frontend/
├── diagnostics/
├── Dockerfile
└── render.yaml
```

Archivos importantes:

- [`backend/app.py`](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\backend\app.py)
- [`backend/compiler.py`](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\backend\compiler.py)
- [`frontend/index.html`](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\frontend\index.html)
- [`frontend/app.js`](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\frontend\app.js)
- [`firmware/include/RobotHAL.h`](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\firmware\include\RobotHAL.h)
- [`render.yaml`](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\render.yaml)

## Nota importante sobre Windows

Durante las pruebas encontramos que `Smart App Control` en Windows 11 puede bloquear partes del toolchain de `arduino-cli`.

Si la compilacion falla con mensajes relacionados con bloqueo de aplicaciones, revisa esa configuracion del sistema.

## Resumen

Pixi Blocks Lab ya no es solo una idea:

- ya tiene web
- ya tiene compilador
- ya programa una `ESP32-S3 Zero`
- ya controla hardware real

Y lo mas importante:

la arquitectura ya esta encaminada para crecer de manera ordenada.
