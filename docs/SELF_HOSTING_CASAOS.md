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

## Opcion recomendada en CasaOS

Usa el archivo:

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

## Que ya no necesitas hacer

Cuando Pixi corre en tu servidor propio, normalmente ya no necesitas:

- abrir Render para usar la web
- correr el compilador desde PowerShell en tu PC principal
- escribir manualmente un endpoint de compilador

El servidor pasa a ser el punto central de la aplicacion.
