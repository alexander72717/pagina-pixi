import os
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from compiler import build_sketch_bundle, detect_arduino_cli


BASE_DIR = Path(__file__).resolve().parent
GENERATED_DIR = BASE_DIR / "generated"
GENERATED_DIR.mkdir(exist_ok=True)
FRONTEND_DIR = BASE_DIR.parent / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
CORS(app)


def is_cloud_runtime():
    return os.getenv("RENDER", "").lower() == "true"


def upload_supported():
    return not is_cloud_runtime()


def compile_supported():
    return not is_cloud_runtime()


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
                "message": "Backend listo para generar sketches de ESP32-S3.",
                "arduino_cli": cli_info,
                "runtime_mode": "cloud" if is_cloud_runtime() else "local",
                "upload_supported": upload_supported(),
                "compile_supported": compile_supported(),
                "service_role": "compiler-and-web" if not is_cloud_runtime() else "web",
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
                    "runtime_mode": "cloud" if is_cloud_runtime() else "local",
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
        fqbn = payload.get("fqbn", "esp32:esp32:esp32s3")
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

        result = build_sketch_bundle(
            generated_dir=GENERATED_DIR,
            project_name=project_name,
            board=board,
            workspace_json=workspace_json,
            cpp_code=cpp_code,
            fqbn=fqbn,
            port=port,
            upload=upload,
        )

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


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(debug=False, host="0.0.0.0", port=port)
