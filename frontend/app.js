const isFrontendDevServer = window.location.hostname === "127.0.0.1" && window.location.port === "5500";
const BACKEND_URL = isFrontendDevServer ? "http://127.0.0.1:5000" : window.location.origin;
const DEFAULT_COMPILER_URL = "http://127.0.0.1:5000";

function defineRobotBlocks() {
  Blockly.defineBlocksWithJsonArray([
    {
      type: "robot_move_forward",
      message0: "mover adelante velocidad %1",
      args0: [
        {
          type: "field_number",
          name: "SPEED",
          value: 180,
          min: 0,
          max: 255,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 24,
    },
    {
      type: "robot_turn_left",
      message0: "girar izquierda velocidad %1",
      args0: [
        {
          type: "field_number",
          name: "SPEED",
          value: 180,
          min: 0,
          max: 255,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 24,
    },
    {
      type: "robot_stop",
      message0: "detener motores",
      previousStatement: null,
      nextStatement: null,
      colour: 24,
    },
    {
      type: "robot_read_distance",
      message0: "leer distancia en cm",
      output: "Number",
      colour: 24,
    },
    {
      type: "robot_led_red",
      message0: "encender LED rojo",
      previousStatement: null,
      nextStatement: null,
      colour: 45,
    },
    {
      type: "robot_led_green",
      message0: "encender LED verde",
      previousStatement: null,
      nextStatement: null,
      colour: 90,
    },
    {
      type: "robot_led_blue",
      message0: "encender LED azul",
      previousStatement: null,
      nextStatement: null,
      colour: 210,
    },
    {
      type: "robot_led_white",
      message0: "encender LED blanco",
      previousStatement: null,
      nextStatement: null,
      colour: 45,
    },
    {
      type: "robot_led_off",
      message0: "apagar LED",
      previousStatement: null,
      nextStatement: null,
      colour: 45,
    },
    {
      type: "robot_wait_ms",
      message0: "esperar %1 milisegundos",
      args0: [
        {
          type: "field_number",
          name: "TIME_MS",
          value: 500,
          min: 0,
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 45,
    },
  ]);
}

function indentCode(code) {
  return (
    code
      .split("\n")
      .filter(Boolean)
      .map((line) => `  ${line}`)
      .join("\n") + (code.trim() ? "\n" : "")
  );
}

function createCppGenerator() {
  const generator = new Blockly.Generator("CPP");
  generator.PRECEDENCE = 0;

  generator.scrub_ = function (block, code, thisOnly) {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    const nextCode = thisOnly || !nextBlock ? "" : generator.blockToCode(nextBlock);
    return code + nextCode;
  };

  generator.forBlock.robot_move_forward = function (block) {
    const speed = block.getFieldValue("SPEED");
    return `robot.moverAdelante(${speed});\n`;
  };

  generator.forBlock.robot_turn_left = function (block) {
    const speed = block.getFieldValue("SPEED");
    return `robot.girarIzquierda(${speed});\n`;
  };

  generator.forBlock.robot_stop = function () {
    return "robot.detenerMotores();\n";
  };

  generator.forBlock.robot_read_distance = function () {
    return ["robot.leerDistanciaCm()", generator.PRECEDENCE];
  };

  generator.forBlock.robot_led_red = function () {
    return "robot.encenderLed();\n";
  };

  generator.forBlock.robot_led_green = function () {
    return "robot.encenderLedVerde();\n";
  };

  generator.forBlock.robot_led_blue = function () {
    return "robot.encenderLedAzul();\n";
  };

  generator.forBlock.robot_led_white = function () {
    return "robot.encenderLedBlanco();\n";
  };

  generator.forBlock.robot_led_off = function () {
    return "robot.apagarLed();\n";
  };

  generator.forBlock.robot_wait_ms = function (block) {
    const timeMs = block.getFieldValue("TIME_MS");
    return `robot.esperar(${timeMs});\n`;
  };

  generator.forBlock.math_number = function (block) {
    return [Number(block.getFieldValue("NUM")), generator.PRECEDENCE];
  };

  generator.forBlock.logic_compare = function (block) {
    const opMap = {
      EQ: "==",
      NEQ: "!=",
      LT: "<",
      LTE: "<=",
      GT: ">",
      GTE: ">=",
    };
    const operator = opMap[block.getFieldValue("OP")] || "==";
    const left = generator.valueToCode(block, "A", generator.PRECEDENCE) || "0";
    const right = generator.valueToCode(block, "B", generator.PRECEDENCE) || "0";
    return [`(${left} ${operator} ${right})`, generator.PRECEDENCE];
  };

  generator.forBlock.controls_if = function (block) {
    const condition = generator.valueToCode(block, "IF0", generator.PRECEDENCE) || "false";
    const branch = generator.statementToCode(block, "DO0") || "";
    return `if (${condition}) {\n${indentCode(branch)}}\n`;
  };

  generator.forBlock.controls_repeat_ext = function (block) {
    const repeats = generator.valueToCode(block, "TIMES", generator.PRECEDENCE) || "1";
    const branch = generator.statementToCode(block, "DO") || "";
    return `for (int i = 0; i < ${repeats}; i++) {\n${indentCode(branch)}}\n`;
  };

  return generator;
}

defineRobotBlocks();
const cppGenerator = createCppGenerator();
const workspace = Blockly.inject("blocklyDiv", {
  toolbox: document.getElementById("toolbox"),
  trashcan: true,
});

const generatedCodeEl = document.getElementById("generated-code");
const backendResponseEl = document.getElementById("backend-response");
const backendStatusEl = document.getElementById("backend-status");
const serialStatusEl = document.getElementById("serial-status");
const fqbnInput = document.getElementById("fqbn-input");
const portInput = document.getElementById("port-input");
const uploadButton = document.getElementById("upload-btn");
const compilerUrlInput = document.getElementById("compiler-url-input");

const savedCompilerUrl = window.localStorage.getItem("pixi_compiler_url");
compilerUrlInput.value = savedCompilerUrl || DEFAULT_COMPILER_URL;

function getCompilerUrl() {
  const raw = compilerUrlInput.value.trim();
  return raw || DEFAULT_COMPILER_URL;
}

function persistCompilerUrl() {
  window.localStorage.setItem("pixi_compiler_url", getCompilerUrl());
}

function refreshGeneratedCode() {
  try {
    const code = cppGenerator.workspaceToCode(workspace).trim() || "// Aun no hay bloques conectados.";
    generatedCodeEl.textContent = code;
  } catch (error) {
    generatedCodeEl.textContent = `Error generando codigo: ${error.message}`;
  }
}

workspace.addChangeListener(refreshGeneratedCode);
refreshGeneratedCode();

async function checkBackend() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const rawText = await response.text();
    const data = JSON.parse(rawText);
    const cliMessage = data.arduino_cli?.available
      ? ` Arduino CLI listo. ${data.arduino_cli.version}`
      : " Arduino CLI no disponible.";
    const runtimeMessage =
      data.runtime_mode === "cloud"
        ? " Modo online: interfaz publica."
        : " Modo local: servicio compilador activo.";
    const roleMessage =
      data.service_role === "web"
        ? " Esta instancia publica sirve la interfaz."
        : " Esta instancia puede servir como compilador local.";
    backendStatusEl.textContent = `${data.status}: ${data.message}${cliMessage}${runtimeMessage}${roleMessage}`;
  } catch (error) {
    backendStatusEl.textContent = `No se pudo conectar al backend: ${error.message}`;
  }
}

async function checkCompiler() {
  persistCompilerUrl();

  try {
    const response = await fetch(`${getCompilerUrl()}/api/health`);
    const rawText = await response.text();
    const data = JSON.parse(rawText);
    const compileMessage = data.compile_supported
      ? " Compilacion disponible."
      : " Esta instancia no compila.";
    const uploadMessage = data.upload_supported
      ? " Subida USB disponible."
      : " Subida USB no disponible.";
    backendResponseEl.textContent = JSON.stringify(data, null, 2);
    serialStatusEl.textContent = `${data.status}: compiler endpoint conectado.${compileMessage}${uploadMessage}`;
    uploadButton.disabled = !data.upload_supported;
    uploadButton.title = data.upload_supported
      ? ""
      : "Este compiler endpoint no permite subida directa por USB.";
  } catch (error) {
    serialStatusEl.textContent = `No se pudo conectar al compiler endpoint: ${error.message}`;
  }
}

async function sendSketch(upload = false) {
  persistCompilerUrl();
  const cppCode = cppGenerator.workspaceToCode(workspace).trim();

  if (!cppCode) {
    backendResponseEl.textContent = "Primero agrega algunos bloques para poder generar codigo.";
    return;
  }

  try {
    const response = await fetch(`${getCompilerUrl()}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_name: "pixi_robot",
        board: "esp32-s3-zero",
        fqbn: fqbnInput.value.trim() || "esp32:esp32:esp32s3",
        port: portInput.value.trim(),
        upload,
        workspace: Blockly.serialization.workspaces.save(workspace),
        cpp_code: cppCode,
      }),
    });

    const rawText = await response.text();

    try {
      const data = JSON.parse(rawText);
      backendResponseEl.textContent = JSON.stringify(data, null, 2);
    } catch {
      backendResponseEl.textContent = `El backend no devolvio JSON.\n\nHTTP ${response.status}\n\n${rawText}`;
    }
  } catch (error) {
    backendResponseEl.textContent = `Error enviando al backend: ${error.message}`;
  }
}

async function requestSerialPort() {
  if (!("serial" in navigator)) {
    serialStatusEl.textContent =
      "Este navegador no soporta Web Serial. Usa Chrome o Edge en localhost.";
    return;
  }

  try {
    const port = await navigator.serial.requestPort();
    serialStatusEl.textContent = `Puerto seleccionado correctamente: ${port.getInfo ? JSON.stringify(port.getInfo()) : "listo"}`;
  } catch (error) {
    serialStatusEl.textContent = `No se selecciono puerto: ${error.message}`;
  }
}

document.getElementById("run-check").addEventListener("click", checkBackend);
document.getElementById("compiler-check").addEventListener("click", checkCompiler);
document.getElementById("generate-btn").addEventListener("click", () => sendSketch(false));
document.getElementById("upload-btn").addEventListener("click", () => sendSketch(true));
document.getElementById("serial-btn").addEventListener("click", requestSerialPort);
compilerUrlInput.addEventListener("change", persistCompilerUrl);

checkBackend();
checkCompiler();
