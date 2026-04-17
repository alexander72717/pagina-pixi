import json
import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path


def _sanitize_name(name: str) -> str:
    safe = "".join(char if char.isalnum() or char in ("-", "_") else "_" for char in name)
    return safe or "robot_program"


def _load_template(project_root: Path) -> str:
    template_path = project_root.parent.parent / "firmware" / "robot_template.ino"
    return template_path.read_text(encoding="utf-8")


def detect_arduino_cli():
    try:
        completed = subprocess.run(
            _arduino_cli_command("version"),
            capture_output=True,
            text=True,
            check=True,
        )
        return {
            "available": True,
            "version": completed.stdout.strip() or completed.stderr.strip(),
        }
    except (FileNotFoundError, subprocess.CalledProcessError) as exc:
        return {
            "available": False,
            "version": str(exc),
        }


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


def _arduino_cli_command(*parts):
    config_file = os.getenv("ARDUINO_CONFIG_FILE", "").strip()
    command = ["arduino-cli"]
    if config_file:
        command.extend(["--config-file", config_file])
    command.extend(parts)
    return command


def build_sketch_bundle(
    generated_dir: Path,
    project_name: str,
    board: str,
    workspace_json,
    cpp_code: str,
    fqbn: str,
    port: str | None = None,
    upload: bool = False,
):
    safe_name = _sanitize_name(project_name)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    sketch_dir = generated_dir / f"{safe_name}_{timestamp}"
    sketch_dir.mkdir(parents=True, exist_ok=True)

    template = _load_template(generated_dir)
    sketch_code = template.replace("// USER_LOGIC_PLACEHOLDER", cpp_code)

    sketch_name = sketch_dir.name
    ino_path = sketch_dir / f"{sketch_name}.ino"
    workspace_path = sketch_dir / "workspace.json"
    include_dir = sketch_dir / "include"
    build_dir = sketch_dir / "build"
    include_dir.mkdir(exist_ok=True)
    build_dir.mkdir(exist_ok=True)

    hal_source = generated_dir.parent.parent / "firmware" / "include" / "RobotHAL.h"
    shutil.copy2(hal_source, include_dir / "RobotHAL.h")

    ino_path.write_text(sketch_code, encoding="utf-8")
    workspace_path.write_text(
        json.dumps(workspace_json or {}, indent=2, ensure_ascii=True),
        encoding="utf-8",
    )

    compile_result = _run_command(
        _arduino_cli_command(
            "compile",
            "--fqbn",
            fqbn,
            "--output-dir",
            str(build_dir),
            str(sketch_dir),
        )
    )

    binary_path = build_dir / f"{sketch_name}.ino.bin"
    response = {
        "status": "ok" if compile_result["returncode"] == 0 else "error",
        "message": "Sketch compilado correctamente." if compile_result["returncode"] == 0 else "La compilacion fallo.",
        "board": board,
        "project_name": safe_name,
        "fqbn": fqbn,
        "port": port,
        "sketch_path": str(ino_path),
        "workspace_path": str(workspace_path),
        "binary_path": str(binary_path) if binary_path.exists() else None,
        "compile_mode": "arduino-cli",
        "sketch_code": sketch_code,
        "compile_result": compile_result,
    }

    if compile_result["returncode"] != 0:
        return response

    if upload:
        if not port:
            response["status"] = "error"
            response["message"] = "La compilacion salio bien, pero falta el puerto COM para subir a la placa."
            return response

        upload_result = _run_command(
            _arduino_cli_command("upload", "-p", port, "--fqbn", fqbn, str(sketch_dir))
        )
        response["upload_result"] = upload_result
        response["status"] = "ok" if upload_result["returncode"] == 0 else "error"
        response["message"] = (
            "Sketch compilado y subido correctamente."
            if upload_result["returncode"] == 0
            else "La compilacion salio bien, pero la carga a la placa fallo."
        )

    return response
