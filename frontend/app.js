const isFrontendDevServer = window.location.hostname === "127.0.0.1" && window.location.port === "5500";
const BACKEND_URL = isFrontendDevServer ? "http://127.0.0.1:5000" : window.location.origin;
const DEFAULT_COMPILER_URL =
  window.location.protocol === "https:" ? "https://localhost:5443" : "http://127.0.0.1:5000";
const DEFAULT_PROJECT_NAME = "mi_proyecto";

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
      type: "robot_led_set_color",
      message0: "poner LED en color %1",
      args0: [
        {
          type: "field_dropdown",
          name: "COLOR",
          options: [
            ["rojo", "RED"],
            ["verde", "GREEN"],
            ["azul", "BLUE"],
            ["blanco", "WHITE"],
            ["apagado", "OFF"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 45,
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

  generator.forBlock.robot_led_set_color = function (block) {
    const color = block.getFieldValue("COLOR");
    const colorMap = {
      RED: "robot.encenderLed();\n",
      GREEN: "robot.encenderLedVerde();\n",
      BLUE: "robot.encenderLedAzul();\n",
      WHITE: "robot.encenderLedBlanco();\n",
      OFF: "robot.apagarLed();\n",
    };

    return colorMap[color] || "robot.apagarLed();\n";
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
const projectNameInput = document.getElementById("project-name-input");
const boardSelect = document.getElementById("board-select");
const generateButton = document.getElementById("generate-btn");
const saveProjectButton = document.getElementById("save-project-btn");
const loadProjectButton = document.getElementById("load-project-btn");
const progressTitleEl = document.getElementById("progress-title");
const progressPercentEl = document.getElementById("progress-percent");
const progressBarEl = document.getElementById("progress-bar");
const progressMessageEl = document.getElementById("progress-message");

const savedCompilerUrl = window.localStorage.getItem("pixi_compiler_url");
const savedPortsByBoard = JSON.parse(window.localStorage.getItem("pixi_ports_by_board") || "{}");
const migratedCompilerUrl =
  window.location.protocol === "https:" &&
  (!savedCompilerUrl || savedCompilerUrl === "http://127.0.0.1:5000" || savedCompilerUrl === "http://localhost:5000")
    ? "https://localhost:5443"
    : savedCompilerUrl || DEFAULT_COMPILER_URL;
compilerUrlInput.value = migratedCompilerUrl;
window.localStorage.setItem("pixi_compiler_url", migratedCompilerUrl);
projectNameInput.value = window.localStorage.getItem("pixi_project_name") || DEFAULT_PROJECT_NAME;
let lastCompilerHealth = null;

let progressValue = 0;
let progressTimer = null;

function normalizeProjectName() {
  const raw = projectNameInput.value.trim();
  const safe = raw || DEFAULT_PROJECT_NAME;
  projectNameInput.value = safe;
  window.localStorage.setItem("pixi_project_name", safe);
  return safe;
}

function getProjectStorageKey() {
  return `pixi_saved_project_${normalizeProjectName()}`;
}

function getCompilerUrl() {
  const raw = compilerUrlInput.value.trim();
  return raw || DEFAULT_COMPILER_URL;
}

function persistCompilerUrl() {
  window.localStorage.setItem("pixi_compiler_url", getCompilerUrl());
}

function getSavedPortsByBoard() {
  return JSON.parse(window.localStorage.getItem("pixi_ports_by_board") || "{}");
}

function savePortForBoard(boardId, port) {
  if (!boardId || !port) {
    return;
  }

  const portsByBoard = getSavedPortsByBoard();
  portsByBoard[boardId] = port;
  window.localStorage.setItem("pixi_ports_by_board", JSON.stringify(portsByBoard));
}

function isInsecureCompilerEndpointFromSecurePage() {
  return window.location.protocol === "https:" && getCompilerUrl().startsWith("http://");
}

function getCompilerEndpointErrorMessage() {
  const endpoint = getCompilerUrl();

  if (isInsecureCompilerEndpointFromSecurePage()) {
    return [
      "No se puede conectar al compiler endpoint desde esta pagina online.",
      "",
      "Causa probable:",
      "la web esta cargada por HTTPS en Render, pero el compiler endpoint local usa HTTP.",
      "",
      "Que puedes hacer ahora:",
      "1. Arranca el compiler service local en HTTPS.",
      "2. Luego abre https://localhost:5443/api/health y acepta el certificado local una vez.",
      "3. Despues vuelve a esta pagina y prueba otra vez.",
    ].join("\n");
  }

  return [
    `No se pudo conectar al compiler endpoint: ${endpoint}`,
    "",
    "Revisa que el compilador local este corriendo en tu PC:",
    `${endpoint}/api/health`,
    "",
    "Si estas usando otro dispositivo distinto al que corre el compilador:",
    "no uses localhost ni 127.0.0.1.",
    "Usa la IP local de la PC que corre el compilador, por ejemplo https://192.168.1.20:5443",
  ].join("\n");
}

function setBoardOptions(boards) {
  const entries = Object.entries(boards || {});
  if (!entries.length) {
    return;
  }

  const savedBoardId = window.localStorage.getItem("pixi_board_id") || "esp32-s3-zero";

  boardSelect.innerHTML = "";

  entries.forEach(([boardId, profile]) => {
    const option = document.createElement("option");
    option.value = boardId;
    option.textContent = profile.label || boardId;
    boardSelect.appendChild(option);
  });

  boardSelect.value = entries.some(([boardId]) => boardId === savedBoardId)
    ? savedBoardId
    : entries[0][0];

  updateBoardSelectionFromUI(boards);
}

function updateBoardSelectionFromUI(boardsMap = null) {
  const boards = boardsMap || window.pixiBoards || {};
  const profile = boards[boardSelect.value];
  if (!profile) {
    return;
  }

  window.pixiBoards = boards;
  fqbnInput.value = profile.fqbn || fqbnInput.value;
  window.localStorage.setItem("pixi_board_id", boardSelect.value);

  const portsByBoard = getSavedPortsByBoard();
  if (portsByBoard[boardSelect.value]) {
    portInput.value = portsByBoard[boardSelect.value];
  }
}

function setProgress(value, message, title = "Proceso actual") {
  progressValue = Math.max(0, Math.min(100, value));
  progressBarEl.style.width = `${progressValue}%`;
  progressPercentEl.textContent = `${Math.round(progressValue)}%`;
  progressTitleEl.textContent = title;
  if (message) {
    progressMessageEl.textContent = message;
  }
}

function stopFakeProgress(finalValue, message, title = "Proceso actual") {
  if (progressTimer) {
    window.clearInterval(progressTimer);
    progressTimer = null;
  }
  setProgress(finalValue, message, title);
}

function startFakeProgress(upload = false) {
  stopFakeProgress(5, upload ? "Preparando compilacion y subida..." : "Preparando compilacion...");
  const target = upload ? 90 : 82;
  progressTimer = window.setInterval(() => {
    const increment = progressValue < 20 ? 4 : progressValue < 50 ? 2.5 : 0.8;
    if (progressValue < target) {
      setProgress(
        progressValue + increment,
        upload ? "Compilando y preparando la carga a la placa..." : "Compilando el proyecto..."
      );
    }
  }, upload ? 500 : 400);
}

function setBusyState(isBusy) {
  generateButton.disabled = isBusy;
  uploadButton.disabled = isBusy || uploadButton.dataset.allowed === "false";
  saveProjectButton.disabled = isBusy;
  loadProjectButton.disabled = isBusy;
}

function saveProjectToBrowser() {
  try {
    const projectName = normalizeProjectName();
    const payload = {
      name: projectName,
      saved_at: new Date().toISOString(),
      workspace: Blockly.serialization.workspaces.save(workspace),
    };
    window.localStorage.setItem(getProjectStorageKey(), JSON.stringify(payload));
    backendResponseEl.textContent = `Proyecto "${projectName}" guardado correctamente en este navegador.`;
  } catch (error) {
    backendResponseEl.textContent = `No se pudo guardar el proyecto: ${error.message}`;
  }
}

function loadProjectFromBrowser() {
  try {
    const projectName = normalizeProjectName();
    const raw = window.localStorage.getItem(getProjectStorageKey());

    if (!raw) {
      backendResponseEl.textContent = `No existe un proyecto guardado con el nombre "${projectName}".`;
      return;
    }

    const payload = JSON.parse(raw);
    Blockly.serialization.workspaces.load(payload.workspace || {}, workspace);
    backendResponseEl.textContent = `Proyecto "${projectName}" cargado correctamente.`;
  } catch (error) {
    backendResponseEl.textContent = `No se pudo cargar el proyecto: ${error.message}`;
  }
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
  if (data.boards) {
      setBoardOptions(data.boards);
    }
    if (data.recommended_compiler_endpoint && !isFrontendDevServer) {
      compilerUrlInput.value = data.recommended_compiler_endpoint;
      persistCompilerUrl();
    }
  } catch (error) {
    backendStatusEl.textContent = `No se pudo conectar al backend: ${error.message}`;
  }
}

async function checkCompiler() {
  persistCompilerUrl();

  if (isInsecureCompilerEndpointFromSecurePage()) {
    serialStatusEl.textContent = "No se puede probar un compiler endpoint HTTP desde la pagina HTTPS de Render.";
    backendResponseEl.textContent = getCompilerEndpointErrorMessage();
    uploadButton.dataset.allowed = "false";
    uploadButton.disabled = true;
    uploadButton.title = "Abre la version local de la web o usa un compiler endpoint con HTTPS.";
    return;
  }

  try {
    const response = await fetch(`${getCompilerUrl()}/api/health`);
    const rawText = await response.text();
    const data = JSON.parse(rawText);
    lastCompilerHealth = data;
    const compileMessage = data.compile_supported
      ? " Compilacion disponible."
      : " Esta instancia no compila.";
    const uploadMessage = data.upload_supported
      ? " Subida USB disponible."
      : " Subida USB no disponible.";
    const httpsMessage = data.https_enabled ? " HTTPS local activo." : "";
    backendResponseEl.textContent = JSON.stringify(data, null, 2);
    serialStatusEl.textContent = `${data.status}: compiler endpoint conectado.${compileMessage}${uploadMessage}${httpsMessage}`;
    uploadButton.dataset.allowed = data.upload_supported ? "true" : "false";
    uploadButton.disabled = !data.upload_supported;
    uploadButton.title = data.upload_supported
      ? ""
      : "Este compiler endpoint no permite subida directa por USB.";
    if (data.boards) {
      setBoardOptions(data.boards);
    }
    await refreshDetectedPorts();
  } catch (error) {
    serialStatusEl.textContent = `No se pudo conectar al compiler endpoint: ${error.message}`;
    backendResponseEl.textContent = getCompilerEndpointErrorMessage();
  }
}

async function refreshDetectedPorts() {
  try {
    const response = await fetch(`${getCompilerUrl()}/api/ports`);
    const rawText = await response.text();
    const data = JSON.parse(rawText);

    if (!response.ok || data.status !== "ok") {
      return;
    }

    const ports = data.ports || [];
    if (!ports.length) {
      return;
    }

    const currentBoard = boardSelect.value || "esp32-s3-zero";
    const currentFqbn = fqbnInput.value.trim();
    const savedPort = getSavedPortsByBoard()[currentBoard];

    const preferredPort =
      ports.find((port) => port.address === savedPort) ||
      ports.find((port) => port.fqbn === currentFqbn) ||
      ports[0];

    if (preferredPort?.address) {
      portInput.value = preferredPort.address;
      savePortForBoard(currentBoard, preferredPort.address);
      serialStatusEl.textContent = `${serialStatusEl.textContent} Puerto detectado: ${preferredPort.address}.`;
    }
  } catch (_error) {
    // Si no se pueden consultar puertos, dejamos el valor manual actual.
  }
}

async function sendSketch(upload = false) {
  persistCompilerUrl();
  normalizeProjectName();
  const cppCode = cppGenerator.workspaceToCode(workspace).trim();

  if (!cppCode) {
    backendResponseEl.textContent = "Primero agrega algunos bloques para poder generar codigo.";
    return;
  }

  if (isInsecureCompilerEndpointFromSecurePage()) {
    backendResponseEl.textContent = getCompilerEndpointErrorMessage();
    serialStatusEl.textContent = "La compilacion desde Render hacia un compiler endpoint HTTP local esta bloqueada por el navegador.";
    stopFakeProgress(0, "Conexion bloqueada antes de iniciar.", upload ? "Compilar y subir" : "Compilar sketch");
    return;
  }

  try {
    setBusyState(true);
    startFakeProgress(upload);
    const response = await fetch(`${getCompilerUrl()}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_name: normalizeProjectName(),
        board: boardSelect.value || "esp32-s3-zero",
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
      stopFakeProgress(
        data.status === "ok" ? 100 : 0,
        data.message || "Proceso finalizado.",
        upload ? "Compilar y subir" : "Compilar sketch"
      );
    } catch {
      backendResponseEl.textContent = `El backend no devolvio JSON.\n\nHTTP ${response.status}\n\n${rawText}`;
      stopFakeProgress(0, "La operacion termino con una respuesta inesperada.", upload ? "Compilar y subir" : "Compilar sketch");
    }
  } catch (error) {
    backendResponseEl.textContent = `Error enviando al backend: ${error.message}\n\n${getCompilerEndpointErrorMessage()}`;
    stopFakeProgress(0, `Error: ${error.message}`, upload ? "Compilar y subir" : "Compilar sketch");
  } finally {
    setBusyState(false);
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
generateButton.addEventListener("click", () => sendSketch(false));
uploadButton.addEventListener("click", () => sendSketch(true));
document.getElementById("serial-btn").addEventListener("click", requestSerialPort);
compilerUrlInput.addEventListener("change", persistCompilerUrl);
projectNameInput.addEventListener("change", normalizeProjectName);
boardSelect.addEventListener("change", async () => {
  updateBoardSelectionFromUI();
  await refreshDetectedPorts();
});
portInput.addEventListener("change", () => savePortForBoard(boardSelect.value, portInput.value.trim()));
saveProjectButton.addEventListener("click", saveProjectToBrowser);
loadProjectButton.addEventListener("click", loadProjectFromBrowser);

checkBackend();
checkCompiler();
setProgress(0, "Sin actividad.");
