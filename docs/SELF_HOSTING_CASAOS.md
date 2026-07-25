# Migrar Pixi Blocks Lab a Ubuntu Server con CasaOS

Esta guia explica como mover Pixi Blocks Lab desde Render o desde tu PC principal hacia tu propio servidor.

La idea de esta migracion es:

1. tu servidor Ubuntu/CasaOS publica la pagina
2. ese mismo servidor compila el codigo para la ESP32
3. el navegador del usuario carga el firmware en la placa conectada a su propio equipo

## Como queda la arquitectura

```text
Usuario
  |
  v
Pixi en tu servidor CasaOS
  |
  v
Compilacion con arduino-cli dentro del contenedor
  |
  v
Firmware listo para descargar/cargar desde el navegador
```

La carga por USB no ocurre en el servidor. La placa debe estar conectada al computador que abre la pagina y pulsa `Cargar en esta placa`.

## Estado actual validado

El despliegue en CasaOS ya logro:

- levantar la pagina desde el servidor
- descargar la imagen Docker desde GitHub Container Registry
- ejecutar el backend dentro del contenedor
- compilar para `ESP32-S3 Zero` usando `arduino-cli`
- generar `binary` y `merged_binary` como artefactos descargables
- publicar la pagina con HTTPS usando Tailscale Funnel

Una respuesta exitosa de compilacion debe tener:

```json
{
  "status": "ok",
  "message": "Sketch compilado correctamente.",
  "compile_result": {
    "returncode": 0
  }
}
```

Si ves eso, la compilacion ya funciona. El siguiente reto ya no es compilar, sino mantener la carga local desde el navegador y luego decidir si la publicacion publica se queda en Funnel o migra a un dominio propio.

URL publica actual por Funnel:

```text
https://servidor-spixers.tailc32d79.ts.net/
```

## Opcion recomendada en CasaOS sin terminal

Si no tienes terminal en CasaOS o no estas en la misma red que el servidor, usa el boton `+` de CasaOS para crear una app personalizada.

En CasaOS busca una opcion parecida a:

- `Custom Install`
- `Install a customized app`
- `Compose`
- `Docker Compose`

Luego pega este contenido:

```yaml
services:
  pixi-blocks-lab:
    image: ghcr.io/alexander72717/pagina-pixi:latest
    container_name: pixi-blocks-lab
    restart: unless-stopped
    environment:
      PORT: "10000"
      PIXI_RUNTIME_MODE: "local"
      PIXI_FORCE_LOCAL: "true"
      PIXI_USE_HTTPS: "false"
    ports:
      - "8080:10000"
    volumes:
      - pixi-generated:/app/backend/generated
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://127.0.0.1:10000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  pixi-generated:
```

Ese mismo contenido tambien quedo guardado en:

```text
casaos-compose.yml
```

## Opcion con terminal o SSH

Si tienes acceso por terminal, usa el archivo:

```text
docker-compose.yml
```

Ese archivo crea un servicio llamado:

```text
pixi-blocks-lab
```

Y publica la app en:

```text
http://IP_DEL_SERVIDOR:8080
```

Ejemplo:

```text
http://192.168.1.50:8080
```

## Variables importantes

El `docker-compose.yml` usa estas variables:

```yaml
PIXI_RUNTIME_MODE: "local"
PIXI_FORCE_LOCAL: "true"
PIXI_USE_HTTPS: "false"
```

Esto le dice a Pixi:

- no eres Render
- si puedes compilar
- sirve la web y el compilador juntos

## Como probar que funciona

Despues de levantar el contenedor, abre:

```text
http://IP_DEL_SERVIDOR:8080/api/health
```

La respuesta correcta debe incluir algo parecido a:

```json
{
  "status": "ok",
  "runtime_mode": "local",
  "compile_supported": true,
  "service_role": "compiler-and-web"
}
```

Si `compile_supported` aparece como `false`, Pixi cree que esta en modo web solamente y no esta configurado como compilador.

## Error `denied` al instalar en CasaOS

Si CasaOS muestra un error parecido a:

```text
Error response from daemon: error from registry: denied denied
```

significa que Docker no pudo descargar la imagen desde GitHub Container Registry.

Las causas mas comunes son:

- la imagen todavia se esta construyendo en GitHub Actions
- el paquete Docker existe, pero esta privado
- el nombre de la imagen o el tag quedaron mal escritos

Primero revisa que la build haya terminado correctamente:

```text
https://github.com/alexander72717/pagina-pixi/actions
```

Debe aparecer `Build Docker image` con check verde.

Despues revisa la visibilidad del paquete:

```text
https://github.com/users/alexander72717/packages/container/package/pagina-pixi
```

En `Package settings`, cambia la visibilidad a `Public`.

En CasaOS los campos deben quedar asi:

```text
Docker Image: ghcr.io/alexander72717/pagina-pixi
Tag: latest
```

No pongas `:latest` dentro del campo `Docker Image` si CasaOS tambien tiene un campo separado para `Tag`.

## Si ya esta publico y todavia falla

Si el paquete ya aparece como `Public`, pero CasaOS sigue fallando, normalmente significa que CasaOS guardo una configuracion vieja o esta intentando iniciar una app creada con campos incompletos.

La forma mas limpia de corregirlo es:

1. borra la app fallida de Pixi en CasaOS
2. vuelve al boton `+`
3. elige instalacion personalizada por `Docker Compose` si aparece
4. pega el contenido de `casaos-compose.yml`
5. instala de nuevo

El compose recomendado para CasaOS usa:

```yaml
image: ghcr.io/alexander72717/pagina-pixi:latest
pull_policy: always
```

`pull_policy: always` le dice a CasaOS/Docker que intente descargar la imagen nueva y no se quede usando una copia vieja.

Si CasaOS no te deja pegar compose y solo te deja llenar campos manuales, usa:

```text
Docker Image: ghcr.io/alexander72717/pagina-pixi
Tag: latest
Title: Pixi Blocks Lab
Web UI port: 8080
Container port: 10000
Network: bridge
```

Variables de entorno:

```text
PORT=10000
PIXI_RUNTIME_MODE=local
PIXI_FORCE_LOCAL=true
PIXI_USE_HTTPS=false
```

Despues de instalar, abre:

```text
http://IP_DEL_SERVIDOR:8080/api/health
```

Si eso no carga, el contenedor no esta arrancando bien o el puerto no quedo publicado.

## Logs de SSH de CasaOS no son logs de Pixi

Si ves mensajes como estos:

```text
connect ssh error
ssh: handshake failed
dial tcp 127.0.0.1:8080: connect: connection refused
```

eso no es el error interno de Pixi.

Eso significa que CasaOS intento abrir una terminal SSH y no pudo autenticarse o se intento conectar al puerto equivocado.

Para diagnosticar Pixi necesitamos logs del contenedor, normalmente con algo como:

```bash
docker logs pixi-blocks-lab --tail 80
```

Si no tienes terminal, revisa desde la interfaz de CasaOS si la app tiene alguna opcion llamada:

- `Logs`
- `App Logs`
- `Container Logs`
- `Error Info`

Si no aparece ninguna, primero confirma que la imagen se pueda descargar y que la app tenga el puerto `8080 -> 10000`.

## Flujo normal de uso

1. Abre `http://IP_DEL_SERVIDOR:8080`.
2. Crea tu programa con bloques.
3. Pulsa `Compilar`.
4. Espera a que aparezca `Firmware listo`.
5. Conecta la ESP32 al equipo desde donde abriste la pagina.
6. Pulsa `Cargar en esta placa`.

## Nota sobre HTTPS

Para cargar firmware desde el navegador, algunos navegadores pueden exigir HTTPS dependiendo del flujo y de las APIs usadas.

Para pruebas dentro de tu red local podemos empezar con HTTP:

```text
http://IP_DEL_SERVIDOR:8080
```

Mas adelante, cuando queramos hacerlo mas publico o mas estable, lo ideal sera poner HTTPS delante usando un proxy como Nginx Proxy Manager, Cloudflare Tunnel o el sistema de proxy que prefieras en CasaOS.

## Pagina privada vs pagina publica

Si abres Pixi con una direccion como:

```text
http://100.x.x.x:8080
```

esa direccion pertenece a Tailscale. No es publica para todo internet.

Solo pueden verla:

- tus dispositivos conectados a la misma cuenta/red de Tailscale
- usuarios o equipos que tengan permiso dentro de tu tailnet

Para una persona cualquiera en internet, esa URL no existe.

## Opciones para hacer Pixi publico

### Opcion A: Tailscale Funnel

Tailscale Funnel permite exponer un servicio de tu red Tailscale hacia internet con HTTPS.

Ventajas:

- aprovecha que ya estas usando Tailscale
- no tienes que abrir puertos del router
- Tailscale oculta la IP real del servidor
- entrega una URL HTTPS de Tailscale

Limitaciones:

- depende de Tailscale
- usa dominios de Tailscale, no tu dominio propio normal
- Funnel tiene limitaciones de puertos y politicas
- sigue siendo mejor para prototipo, demos y primeras pruebas publicas

Segun la documentacion oficial de Tailscale, Funnel expone un servicio local a internet usando una URL HTTPS y requiere tener Funnel habilitado en la tailnet.

Comandos usados en el servidor:

```bash
sudo tailscale funnel --bg 8080
tailscale funnel status
```

Resultado esperado:

```text
https://servidor-spixers.tailc32d79.ts.net (Funnel on)
|-- / proxy http://127.0.0.1:8080
```

Para apagar Funnel:

```bash
sudo tailscale funnel --https=443 off
```

Importante: al entrar por la URL publica de Funnel, Pixi debe compilar usando el mismo dominio `https://servidor-spixers.tailc32d79.ts.net`. Si en modo avanzado aparece guardado un endpoint viejo como `http://100.x.x.x:8080`, cambialo por la URL HTTPS de Funnel o limpia la configuracion guardada del navegador.

### Opcion B: Cloudflare Tunnel

Cloudflare Tunnel permite publicar tu servidor sin abrir puertos entrantes.

Ventajas:

- recomendado para una publicacion mas seria
- puedes usar un dominio propio
- no expones directamente la IP del servidor
- Cloudflare entrega HTTPS

Limitaciones:

- requiere configurar Cloudflare
- idealmente necesitas un dominio
- agrega una pieza mas a la arquitectura

Segun la documentacion oficial de Cloudflare, Tunnel conecta servicios propios a Cloudflare mediante una conexion saliente, sin abrir puertos publicos en el router.

## Recomendacion actual

Para este momento del proyecto, el camino recomendado es:

1. mantener Pixi funcionando en CasaOS por Tailscale
2. validar compilacion varias veces
3. probar si `Cargar en esta placa` funciona desde `http://100.x.x.x:8080`
4. si la carga local falla por seguridad del navegador, pasar a HTTPS
5. para primera publicacion externa, probar Tailscale Funnel
6. para producto mas serio, migrar a Cloudflare Tunnel con dominio propio

No conviene abrir puertos del router todavia. Es mas riesgoso y no nos aporta mucho en esta fase.

## Que ya no necesitas hacer

Cuando Pixi corre en tu servidor propio, normalmente ya no necesitas:

- abrir Render para usar la web
- correr el compilador desde PowerShell en tu PC principal
- escribir manualmente un endpoint de compilador

El servidor pasa a ser el punto central de la aplicacion.
