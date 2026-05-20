import json
import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

from board_profiles import get_board_profile


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
    except Exception as exc:
        return {
            "available": False,
            "version": str(exc),
            "error_type": type(exc).__name__,
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
    profile = get_board_profile(board)

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
    config_path = include_dir / "BoardConfig.h"

    ino_path.write_text(sketch_code, encoding="utf-8")
    workspace_path.write_text(
        json.dumps(workspace_json or {}, indent=2, ensure_ascii=True),
        encoding="utf-8",
    )
    config_path.write_text(_build_board_config_header(profile), encoding="utf-8")

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
        "board_profile": profile,
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


def _build_board_config_header(profile: dict) -> str:
    led = profile.get("led", {})
    robot = profile.get("robot", {})
    motors = robot.get("motors", {})
    i2c = robot.get("i2c", {})
    oled = robot.get("oled", {})
    lines = [
        "#pragma once",
        "",
        f'#define PIXI_BOARD_LABEL "{profile.get("label", "Unknown Board")}"',
    ]

    if led.get("type") == "rgb":
        lines.extend(
            [
                "#define PIXI_LED_MODE_RGB 1",
                f"#define PIXI_LED_PIN {int(led.get('pin', 21))}",
                f"#define PIXI_LED_ORDER_{led.get('order', 'RGB')} 1",
            ]
        )
    else:
        active_high = 1 if led.get("active_high", True) else 0
        lines.extend(
            [
                "#define PIXI_LED_MODE_DIGITAL 1",
                f"#define PIXI_LED_PIN {int(led.get('pin', 8))}",
                f"#define PIXI_LED_ACTIVE_HIGH {active_high}",
            ]
        )

    lines.extend(
        [
            "",
            f"#define PIXI_BUTTON_PIN {int(robot.get('button_pin', -1))}",
            f"#define PIXI_MOTOR_LEFT_FORWARD_PIN {int(motors.get('left_forward', -1))}",
            f"#define PIXI_MOTOR_LEFT_BACKWARD_PIN {int(motors.get('left_backward', -1))}",
            f"#define PIXI_MOTOR_RIGHT_FORWARD_PIN {int(motors.get('right_forward', -1))}",
            f"#define PIXI_MOTOR_RIGHT_BACKWARD_PIN {int(motors.get('right_backward', -1))}",
            f"#define PIXI_I2C_SDA_PIN {int(i2c.get('sda', -1))}",
            f"#define PIXI_I2C_SCL_PIN {int(i2c.get('scl', -1))}",
            f"#define PIXI_OLED_ADDRESS {oled.get('address', '0x3C')}",
            f"#define PIXI_OLED_WIDTH {int(oled.get('width', 128))}",
            f"#define PIXI_OLED_HEIGHT {int(oled.get('height', 64))}",
            f"#define PIXI_OLED_RESET_PIN {int(oled.get('reset', -1))}",
        ]
    )

    lines.append("")
    return "\n".join(lines)
