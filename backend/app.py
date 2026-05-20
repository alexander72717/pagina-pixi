import json
import os
import socket
import subprocess
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from board_profiles import BOARD_PROFILES, get_board_profile
from compiler import build_sketch_bundle, detect_arduino_cli


BASE_DIR = Path(__file__).resolve().parent
GENERATED_DIR = BASE_DIR / "generated"
GENERATED_DIR.mkdir(exist_ok=True)
FRONTEND_DIR = BASE_DIR.parent / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")


def local_https_enabled():
    return os.getenv("PIXI_USE_HTTPS", "false").lower() in {"1", "true", "yes", "on"}


def force_local_runtime():
    return os.getenv("PIXI_FORCE_LOCAL", "false").lower() in {"1", "true", "yes", "on"}


def get_runtime_mode():
    return "cloud" if is_cloud_runtime() else "local"


def get_allowed_origins():
    env_origins = os.getenv("PIXI_ALLOWED_ORIGINS", "").strip()
    if env_origins:
      return [origin.strip() for origin in env_origins.split(",") if origin.strip()]

    return [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://pixi-blocks-lab.onrender.com",
    ]


def get_local_compiler_endpoint():
    scheme = "https" if local_https_enabled() else "http"
    default_port = "5443" if local_https_enabled() else "5000"
    port = os.getenv("PORT", default_port)
    default_host = "localhost" if local_https_enabled() else "127.0.0.1"
    host = os.getenv("PIXI_LOCAL_HOST", default_host)
    return f"{scheme}://{host}:{port}"


def get_lan_candidates():
    candidates = []

    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, family=socket.AF_INET):
            ip = info[4][0]
            if ip.startswith(("127.", "169.254.")):
                continue
            if ip not in candidates:
                candidates.append(ip)
    except OSError:
        pass

    return candidates


def get_hostname_candidates():
    candidates = []

    computer_name = os.getenv("COMPUTERNAME", "").strip()
    hostname = socket.gethostname().strip()

    for name in (computer_name, hostname):
        if name and name.lower() != "localhost" and name not in candidates:
            candidates.append(name)

    return candidates


def get_recommended_compiler_endpoints():
    if is_cloud_runtime():
        return []

    scheme = "https" if local_https_enabled() else "http"
    port = os.getenv("PORT", "5443" if local_https_enabled() else "5000")
    endpoints = [get_local_compiler_endpoint()]

    for hostname in get_hostname_candidates():
        endpoint = f"{scheme}://{hostname}:{port}"
        if endpoint not in endpoints:
            endpoints.append(endpoint)

    for ip in get_lan_candidates():
        endpoint = f"{scheme}://{ip}:{port}"
        if endpoint not in endpoints:
            endpoints.append(endpoint)

    return endpoints


CORS(
    app,
    resources={r"/api/*": {"origins": get_allowed_origins()}},
    allow_private_network=True,
)


def is_cloud_runtime():
    if force_local_runtime():
        return False

    runtime_override = os.getenv("PIXI_RUNTIME_MODE", "").strip().lower()
    if runtime_override in {"local", "cloud"}:
        return runtime_override == "cloud"

    return os.getenv("RENDER", "").lower() == "true"


def upload_supported():
    return not is_cloud_runtime()


def compile_supported():
    return not is_cloud_runtime()


def _arduino_cli_command(*parts):
    config_file = os.getenv("ARDUINO_CONFIG_FILE", "").strip()
    command = ["arduino-cli"]
    if config_file:
        command.extend(["--config-file", config_file])
    command.extend(parts)
    return command


def _run_command(command):
    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
    )
    return {
        "command": command,
        "returncode": completed.returncode,
        "stdout": completed.stdout,
        "stderr": completed.stderr,
    }


def detect_connected_boards():
    try:
        completed = _run_command(_arduino_cli_command("board", "list", "--json"))
        if completed["returncode"] != 0:
            return {
                "status": "error",
                "message": "No se pudo consultar la lista de placas conectadas.",
                "board_list_result": completed,
                "ports": [],
            }

        payload = json.loads(completed["stdout"] or "{}")
        ports = []

        for item in payload.get("detected_ports", []):
            matching_boards = item.get("matching_boards", [])
            selected_board = matching_boards[0] if matching_boards else {}
            ports.append(
                {
                    "address": item.get("port", {}).get("address") or item.get("address"),
                    "label": item.get("port", {}).get("label") or item.get("label"),
                    "protocol": item.get("port", {}).get("protocol") or item.get("protocol"),
                    "properties": item.get("port", {}).get("properties", {}),
                    "board_name": selected_board.get("name"),
                    "fqbn": selected_board.get("fqbn"),
                    "matching_boards": matching_boards,
                }
            )

        return {
            "status": "ok",
            "message": "Puertos detectados correctamente.",
            "ports": ports,
            "board_list_result": completed,
        }
    except Exception as exc:
        return {
            "status": "error",
            "message": "El servicio no pudo detectar puertos del sistema.",
            "error_type": type(exc).__name__,
            "error_detail": str(exc),
            "ports": [],
        }


def resolve_upload_port(board: str, fqbn: str, requested_port: str | None):
    detection = detect_connected_boards()
    ports = detection.get("ports", [])

    if requested_port and any(port.get("address") == requested_port for port in ports):
        return {
            "selected_port": requested_port,
            "resolution": "requested_port_confirmed",
            "ports": ports,
        }

    profile = get_board_profile(board)
    target_fqbn = fqbn or profile.get("fqbn")
    matching_port = next((port for port in ports if port.get("fqbn") == target_fqbn), None)
    if matching_port and matching_port.get("address"):
        return {
            "selected_port": matching_port["address"],
            "resolution": "auto_detected_from_board",
            "ports": ports,
        }

    if ports and ports[0].get("address"):
        return {
            "selected_port": ports[0]["address"],
            "resolution": "fallback_first_detected_port",
            "ports": ports,
        }

    return {
        "selected_port": requested_port,
        "resolution": "no_port_detected",
        "ports": ports,
    }


@app.after_request
def add_private_network_headers(response):
    if request.path.startswith("/api/"):
        response.headers["Access-Control-Allow-Private-Network"] = "true"
        response.headers["Access-Control-Allow-Headers"] = (
            "Content-Type, Authorization, Access-Control-Request-Private-Network"
        )
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.get("/")
def serve_index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/<path:path>")
def serve_frontend_asset(path: str):
    asset_path = FRONTEND_DIR / path
    if asset_path.exists() and asset_path.is_file():
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/api/health")
def health_check():
    try:
        cli_info = detect_arduino_cli()
        return jsonify(
            {
                "status": "ok",
                "message": "Backend listo para el flujo de compilacion de placas ESP32.",
                "arduino_cli": cli_info,
                "runtime_mode": get_runtime_mode(),
                "upload_supported": upload_supported(),
                "compile_supported": compile_supported(),
                "service_role": "compiler-and-web" if not is_cloud_runtime() else "web",
                "boards": BOARD_PROFILES,
                "recommended_compiler_endpoint": None if is_cloud_runtime() else get_local_compiler_endpoint(),
                "https_enabled": local_https_enabled() if not is_cloud_runtime() else False,
                "lan_candidates": [] if is_cloud_runtime() else get_lan_candidates(),
                "hostname_candidates": [] if is_cloud_runtime() else get_hostname_candidates(),
                "recommended_lan_compiler_endpoints": [] if is_cloud_runtime() else get_recommended_compiler_endpoints(),
                "detected_ports": [] if is_cloud_runtime() else detect_connected_boards().get("ports", []),
            }
        )
    except Exception as exc:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "El endpoint de salud fallo dentro del servidor.",
                    "error_type": type(exc).__name__,
                    "error_detail": str(exc),
                    "runtime_mode": get_runtime_mode(),
                    "upload_supported": upload_supported(),
                    "compile_supported": compile_supported(),
                }
            ),
            500,
        )


@app.post("/api/generate")
def generate_sketch():
    try:
        payload = request.get_json(silent=True) or {}

        workspace_json = payload.get("workspace")
        cpp_code = payload.get("cpp_code", "").strip()
        board = payload.get("board", "esp32-s3-zero")
        project_name = payload.get("project_name", "robot_program")
        profile = get_board_profile(board)
        fqbn = payload.get("fqbn", profile["fqbn"])
        port = payload.get("port")
        upload = bool(payload.get("upload", False))

        if not compile_supported():
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": (
                            "Esta instancia publica sirve la web, pero no compila. "
                            "Configura un compiler endpoint local en tu PC."
                        ),
                        "runtime_mode": "cloud",
                        "service_role": "web",
                    }
                ),
                400,
            )

        if upload and not upload_supported():
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": (
                            "La version online puede compilar, pero no puede subir directo por USB. "
                            "El flashing debe hacerse desde el navegador o desde tu entorno local."
                        ),
                        "runtime_mode": "cloud",
                    }
                ),
                400,
            )

        if not cpp_code:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "No se recibio codigo C++ generado desde Blockly.",
                    }
                ),
                400,
            )

        resolved_port_info = None
        effective_port = port
        if upload:
            resolved_port_info = resolve_upload_port(board, fqbn, port)
            effective_port = resolved_port_info.get("selected_port")

        result = build_sketch_bundle(
            generated_dir=GENERATED_DIR,
            project_name=project_name,
            board=board,
            workspace_json=workspace_json,
            cpp_code=cpp_code,
            fqbn=fqbn,
            port=effective_port,
            upload=upload,
        )

        if resolved_port_info:
            result["requested_port"] = port
            result["resolved_port"] = effective_port
            result["port_resolution"] = resolved_port_info.get("resolution")
            result["detected_ports"] = resolved_port_info.get("ports", [])

        return jsonify(result), (200 if result.get("status") == "ok" else 500)
    except Exception as exc:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "El backend fallo al generar o compilar el sketch.",
                    "error_type": type(exc).__name__,
                    "error_detail": str(exc),
                }
            ),
            500,
        )


@app.get("/api/ports")
def list_ports():
    if not compile_supported():
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Esta instancia publica no puede consultar puertos de hardware.",
                    "ports": [],
                    "runtime_mode": get_runtime_mode(),
                }
            ),
            400,
        )

    result = detect_connected_boards()
    return jsonify(result), (200 if result.get("status") == "ok" else 500)


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5443" if local_https_enabled() else "5000"))
    host = os.getenv("HOST", "0.0.0.0")
    ssl_context = "adhoc" if local_https_enabled() else None
    app.run(debug=False, host=host, port=port, ssl_context=ssl_context)
