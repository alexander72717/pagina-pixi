# Plataforma Educativa para ESP32-S3 Zero

Este proyecto es una base inicial para construir una plataforma educativa donde un nino puede programar un robot con bloques visuales y convertir esa logica en codigo C++ para un `ESP32-S3 Zero`.

## 1. Que hace esta primera version

Esta primera version ya deja lista la estructura principal:

- Un frontend con `Blockly` para crear programas con bloques.
- Un backend con `Flask` para recibir la logica y generar un archivo `.ino`.
- Una capa de abstraccion en C++ para que los bloques usen acciones simples como `moverAdelante()` o `detenerMotores()`.
- Compilacion real con `arduino-cli` en entorno local.
- Base preparada para despliegue online en `Render`.

## 2. Estructura del proyecto

```text
pagina pixi/
├── backend/
│   ├── app.py
│   ├── compiler.py
│   ├── requirements.txt
│   └── generated/
├── firmware/
│   ├── robot_template.ino
│   └── include/
│       └── RobotHAL.h
└── frontend/
    ├── index.html
    ├── app.js
    └── style.css
```

## 3. Como funciona el flujo

1. El usuario arrastra bloques en el navegador.
2. `Blockly` convierte esos bloques en una estructura JSON y en codigo C++ base.
3. El frontend envia esa informacion al backend.
4. El backend arma un sketch `.ino` completo usando una plantilla.
5. Por ahora el backend devuelve el archivo generado y simula la compilacion.
6. En la siguiente fase conectaremos `arduino-cli` para compilar de verdad y luego preparar el flashing.

## 4. Requisitos para esta fase

- `Python 3.11+` recomendado.
- Un navegador moderno como `Chrome` o `Edge`.

## 5. Como ejecutar el backend en local

Abre una terminal dentro de la carpeta `backend` y ejecuta:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Si todo sale bien, el backend quedara corriendo en:

```text
http://127.0.0.1:5000
```

## 6. Como abrir el frontend en local

Para desarrollo simple puedes abrir el archivo:

[`frontend/index.html`](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\frontend\index.html)

Pero para evitar problemas del navegador, es mejor servirlo desde `localhost` con:

```powershell
cd "C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\frontend"
python -m http.server 5500
```

Luego abre:

```text
http://127.0.0.1:5500
```

## 7. Estado actual de la compilacion real

La compilacion real ya esta conectada con `arduino-cli` usando como valor inicial:

- `FQBN`: `esp32:esp32:esp32s3`
- Puerto de ejemplo: `COM5`

Desde el frontend puedes:

- Compilar el sketch.
- Compilar y subir a la placa.

## 8. Estado actual del LED RGB

La placa `ESP32-S3 Zero` ya fue probada con exito para el LED RGB integrado.

- Pin confirmado para esta placa: `GPIO21`
- Orden de color fijado: `RGB`

Actualmente desde Blockly ya puedes usar bloques para:

- LED rojo
- LED verde
- LED azul
- LED blanco
- Apagar LED

## 9. Que es Render y como encaja aqui

`Render` es una plataforma que toma tu proyecto desde un repositorio Git y lo publica en internet con HTTPS.

Para este proyecto vamos a usar `Render` para publicar:

- La interfaz web.
- El backend `Flask`.
- La compilacion remota con `arduino-cli`.

Importante:

- La version online puede compilar.
- La version online no puede acceder al puerto USB de la PC del usuario directamente desde el servidor.
- El acceso al USB debe hacerse desde el navegador del usuario, no desde Render.

Eso encaja bien con `Web Serial`, porque esta API exige contexto seguro (`HTTPS` o `localhost`) segun MDN:

- [Web Serial API en MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)

Y `Render` entrega HTTPS por defecto en sus sitios y servicios:

- [Render Web Services](https://render.com/docs/web-services)
- [Render Static Sites](https://render.com/docs/static-sites)

## 10. Como quedara la arquitectura online

En local:

- Frontend en tu navegador.
- Backend en tu PC.
- Compilacion en tu PC.
- Subida USB desde tu PC.

En Render:

- Frontend online.
- Backend online ligero.
- Compilacion delegada a un compiler endpoint.
- El boton de subir por USB depende del compiler endpoint, no de Render.

En otras palabras:

- `Render` sirve la app publica.
- El compiler endpoint ejecuta la compilacion.
- El navegador del usuario interactua con el hardware.

## 11. Arquitectura escalable que usaremos desde ahora

Desde esta fase vamos a tratar el sistema como dos servicios separados:

1. `Web App`
   sirve la interfaz, configuracion y futuras funciones publicas.

2. `Compiler Service`
   recibe codigo, compila y opcionalmente sube a la placa.

Hoy:

- `Web App` en `Render`
- `Compiler Service` en tu PC

Manana:

- `Web App` puede quedarse en `Render`
- `Compiler Service` puede moverse a una Raspberry, VPS o worker dedicado

Lo importante es que el frontend ya no depende de que ambos esten en el mismo servidor.

## 12. Como usar la version hibrida Render + compilador local

En la interfaz ahora existe un campo llamado `compiler endpoint`.

Valor recomendado en tu PC:

```text
http://127.0.0.1:5000
```

Flujo:

1. Abres la web publica de `Render`.
2. La web usa `Render` para cargar la interfaz.
3. La web llama a tu `compiler endpoint` local para compilar.
4. Si estas en tu PC, tambien puede subir a la placa por USB.

## 13. Archivos agregados para Render

Se dejaron preparados estos archivos:

- [`Dockerfile`](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\Dockerfile)
- [`.dockerignore`](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\.dockerignore)
- [`render.yaml`](C:\Users\samue\Desktop\Spixers\codigo\pagina pixi\render.yaml)

La app ahora tambien puede servir el frontend y el backend desde un mismo servicio `Flask`, lo que simplifica el despliegue.

## 14. Pasos para desplegar en Render

Hay una parte que yo no puedo hacer por ti desde aqui porque requiere tu cuenta:

1. Subir este proyecto a GitHub.
2. Crear una cuenta o iniciar sesion en `Render`.
3. Crear un nuevo `Web Service`.
4. Conectar el repositorio.
5. Elegir despliegue por `Docker`.
6. Esperar a que Render construya la imagen y publique la app.

Como ya dejamos `render.yaml` y `Dockerfile`, Render deberia detectar muy bien la configuracion.

## 15. Flujo recomendado en Render

Cuando el deploy este listo, la URL online tendra este comportamiento:

- `GET /` abre la interfaz Blockly.
- `GET /api/health` informa si `arduino-cli` esta disponible y si el servicio esta en modo local o cloud.
- `POST /api/generate` en cloud devolvera un mensaje indicando que debes usar un compiler endpoint.

En modo cloud:

- `Probar backend` verifica la web publica.
- `Probar compilador` verifica tu compiler endpoint.
- `Compilar sketch` y `Compilar y subir` deben apuntar al compiler endpoint configurado.

## 16. Bloqueo de Windows que ya encontramos

En este equipo encontramos un problema real de Windows 11:

- `Smart App Control` bloqueaba partes del toolchain de `arduino-cli`.

Si la compilacion vuelve a fallar con mensajes parecidos a:

```text
Una directiva de Control de aplicaciones bloqueó este archivo.
```

revisa esa configuracion porque ya vimos que afecta directamente la compilacion para `ESP32-S3`.

## 17. Sobre el tema de "sin drivers"

Hay un punto importante aqui: en muchos casos el `ESP32-S3` funciona como dispositivo USB serial nativo y Windows puede reconocerlo con drivers genericos, pero eso no significa que podamos prometer "sin drivers" en todos los equipos. Depende de:

- La placa exacta.
- El chip USB usado.
- La version de Windows.
- Si entra en modo bootloader por USB nativo o por chip puente.

En otras palabras: podemos diseñar la experiencia para que el usuario no tenga que instalar herramientas complejas, pero todavia hay que validar tu modelo exacto de placa para saber si realmente sera "plug and play" en Windows.

## 18. Siguiente paso recomendado

Despues de probar esta base, el siguiente trabajo tecnico seria:

1. Publicar el prototipo en `Render`.
2. Confirmar la arquitectura `Render + compiler endpoint local`.
3. Mantener el flashing USB en local/navegador.
4. Seguir agregando bloques utiles.
5. Luego pasar a sensores, motores o guardado de proyectos.

## 19. Informacion que me ayudara despues

Cuando quieras seguir con la siguiente fase, me servira que me pases:

- La marca o enlace exacto de tu `ESP32-S3 Zero`.
- Como se conectan los motores, sensores y LEDs.
- Si ya tienes `arduino-cli` instalado.
- Si trabajas en `Windows 10` o `Windows 11`.
