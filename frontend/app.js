const isFrontendDevServer = window.location.hostname === "127.0.0.1" && window.location.port === "5500";
const BACKEND_URL = isFrontendDevServer ? "http://127.0.0.1:5000" : window.location.origin;
const LOCAL_COMPILER_URL =
  window.location.protocol === "https:" ? "https://localhost:5443" : "http://127.0.0.1:5000";
const DEFAULT_COMPILER_URL =
  isFrontendDevServer ? "http://127.0.0.1:5000" : window.location.origin;
const DEFAULT_COMPILER_URLS = [
  "http://127.0.0.1:5000",
  "http://localhost:5000",
  "https://localhost:5443",
  "https://pixi-blocks-lab.onrender.com",
];
const DEFAULT_PROJECT_NAME = "mi_proyecto";
const DEFAULT_BOARD_ID = "esp32-s3-zero";
const DEFAULT_FQBN = "esp32:esp32:esp32s3";

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
const compilerHintsEl = document.getElementById("compiler-hints");
const compilerOptionsEl = document.getElementById("compiler-options");
const compilerUrlOptionsEl = document.getElementById("compiler-url-options");
const portHintsEl = document.getElementById("port-hints");
const flowHintsEl = document.getElementById("flow-hints");
const artifactSummaryEl = document.getElementById("artifact-summary");
const artifactLinksEl = document.getElementById("artifact-links");
const artifactStatusBadgeEl = document.getElementById("artifact-status-badge");
const artifactActionsEl = document.getElementById("artifact-actions");

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
let lastDetectedPorts = [];
let lastFlashManifest = null;

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

function getCompilerUrlObject() {
  try {
    return new URL(getCompilerUrl());
  } catch {
    return null;
  }
}

function isLoopbackHostname(hostname) {
  const normalized = (hostname || "").toLowerCase();
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "[::1]";
}

function isLikelyLocalCompilerEndpoint() {
  const compilerUrl = getCompilerUrlObject();
  if (!compilerUrl) {
    return false;
  }

  return isLoopbackHostname(compilerUrl.hostname);
}

function persistCompilerUrl() {
  window.localStorage.setItem("pixi_compiler_url", getCompilerUrl());
}

function shouldReplaceCompilerUrlWithSameOrigin(data) {
  if (isFrontendDevServer || !data?.compile_supported || data?.service_role === "web") {
    return false;
  }

  return !savedCompilerUrl || DEFAULT_COMPILER_URLS.includes(savedCompilerUrl);
}

function normalizeCompilerCandidates(candidates) {
  const unique = [];

  for (const candidate of candidates || []) {
    const normalized = String(candidate || "").trim().replace(/\/$/, "");

    if (normalized && !unique.includes(normalized)) {
      unique.push(normalized);
    }
  }

  return unique;
}

function getStoredCompilerCandidates() {
  return JSON.parse(window.localStorage.getItem("pixi_compiler_candidates") || "[]");
}

function saveCompilerCandidates(candidates) {
  const unique = normalizeCompilerCandidates(candidates).slice(0, 8);
  window.localStorage.setItem("pixi_compiler_candidates", JSON.stringify(unique));
}

function rememberCompilerCandidates(candidates) {
  saveCompilerCandidates([...getStoredCompilerCandidates(), ...candidates]);
}

function getCompilerCandidateList() {
  const candidates = [getCompilerUrl(), ...getStoredCompilerCandidates()];

  if (window.location.protocol === "https:") {
    candidates.push(LOCAL_COMPILER_URL);
  } else {
    candidates.push(LOCAL_COMPILER_URL);
  }

  return normalizeCompilerCandidates(candidates);
}

function renderCompilerOptions(data = null) {
  const detectedEndpoints = data?.recommended_lan_compiler_endpoints || [];
  const candidates = normalizeCompilerCandidates([
    getCompilerUrl(),
    ...(data?.recommended_compiler_endpoint ? [data.recommended_compiler_endpoint] : []),
    ...detectedEndpoints,
    ...getStoredCompilerCandidates(),
    ...getCompilerCandidateList(),
  ]);
  const currentEndpoint = getCompilerUrl();

  compilerOptionsEl.innerHTML = "";
  compilerUrlOptionsEl.innerHTML = "";

  for (const candidate of candidates) {
    const option = document.createElement("option");
    option.value = candidate;
    compilerUrlOptionsEl.appendChild(option);
  }

  for (const candidate of candidates.slice(0, 5)) {
    const button = document.createElement("button");
    const isCurrent = candidate === currentEndpoint;

    button.type = "button";
    button.className = isCurrent ? "compiler-option compiler-option-active" : "compiler-option";
    button.textContent = isCurrent ? `Actual: ${candidate}` : `Usar ${candidate}`;
    button.title = candidate;
    button.disabled = isCurrent;
    button.addEventListener("click", async () => {
      compilerUrlInput.value = candidate;
      persistCompilerUrl();
      updateRuntimeHints(lastCompilerHealth);
      await checkCompiler();
    });

    compilerOptionsEl.appendChild(button);
  }
}

function updateRuntimeHints(data = null) {
  const endpoint = getCompilerUrl();
  const endpoints = data?.recommended_lan_compiler_endpoints || [];
  const selectedPort = portInput.value.trim();
  const visibleEndpoint = endpoint || "sin definir";
  const localUploadPossible = isLikelyLocalCompilerEndpoint();

  compilerHintsEl.textContent = endpoints.length
    ? `Compilador actual: ${visibleEndpoint}. Opciones detectadas: ${endpoints.join(" | ")}`
    : `Compilador actual: ${visibleEndpoint}`;
  renderCompilerOptions(data);

  if (lastDetectedPorts.length) {
    const summary = lastDetectedPorts
      .map((port) => `${port.address}${port.board_name ? ` (${port.board_name})` : ""}`)
      .join(" | ");
    portHintsEl.textContent = `Puertos detectados: ${summary}${selectedPort ? `. Puerto activo: ${selectedPort}` : ""}`;
  } else {
    portHintsEl.textContent = selectedPort
      ? `No se detectaron puertos automaticamente. Puerto actual: ${selectedPort}`
      : "Conecta la placa para detectar el puerto automaticamente.";
  }

  if (data?.upload_supported && localUploadPossible) {
    flowHintsEl.textContent = "Flujo recomendado: compila el programa y luego usa Cargar en esta placa para programar la ESP32 desde este navegador.";
  } else if (data?.upload_supported && !localUploadPossible) {
    flowHintsEl.textContent = "Flujo recomendado: compila usando el PC compilador y luego carga localmente en la placa conectada a este equipo.";
  } else {
    flowHintsEl.textContent = "Flujo recomendado: compila para generar el firmware y luego cargalo desde el equipo que tiene la placa conectada.";
  }
}

function setArtifactState(status, summary, links = []) {
  artifactSummaryEl.textContent = summary;
  artifactLinksEl.innerHTML = "";
  artifactActionsEl.innerHTML = "";
  lastFlashManifest = null;

  artifactStatusBadgeEl.className = "artifact-badge";
  if (status === "ok") {
    artifactStatusBadgeEl.classList.add("artifact-badge-ok");
    artifactStatusBadgeEl.textContent = "Artefactos listos";
  } else if (status === "error") {
    artifactStatusBadgeEl.classList.add("artifact-badge-error");
    artifactStatusBadgeEl.textContent = "Con errores";
  } else {
    artifactStatusBadgeEl.classList.add("artifact-badge-idle");
    artifactStatusBadgeEl.textContent = "Sin artefactos";
  }

  for (const link of links) {
    const anchor = document.createElement("a");
    anchor.className = "artifact-link";
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = link.label;
    artifactLinksEl.appendChild(anchor);
  }
}

function setFlashManifest(data) {
  const artifactUrls = data?.artifact_urls || {};
  const manifest =
    data?.flash_manifest ||
    (artifactUrls.merged_binary
      ? {
          strategy: "single_merged_image",
          address: "0x0",
          files: [
            {
              label: "merged_binary",
              filename: "merged_binary",
              address: "0x0",
            },
          ],
        }
      : null);

  if (!manifest?.files?.length) {
    return;
  }

  lastFlashManifest = {
    ...manifest,
    files: manifest.files
      .map((file) => ({
        ...file,
        url: artifactUrls[file.label],
      }))
      .filter((file) => Boolean(file.url)),
  };

  if (!lastFlashManifest.files.length) {
    lastFlashManifest = null;
    return;
  }

  const chipFamilyMap = {
    esp32s3: "ESP32-S3",
    esp32c3: "ESP32-C3",
    esp32: "ESP32",
  };
  const chipFamily =
    chipFamilyMap[lastFlashManifest.chip_family] ||
    chipFamilyMap[data?.fqbn?.split(":").pop()] ||
    "ESP32";

  const manifestPayload = {
    name: normalizeProjectName(),
    version: data?.artifact_id || "build-local",
    builds: [
      {
        chipFamily,
        parts: lastFlashManifest.files.map((file) => ({
          path: file.url,
          offset: Number.parseInt(file.address, 16),
        })),
      },
    ],
  };

  const blob = new Blob([JSON.stringify(manifestPayload)], { type: "application/json" });
  const manifestUrl = URL.createObjectURL(blob);

  const flashButton = document.createElement("esp-web-install-button");
  flashButton.setAttribute("manifest", manifestUrl);
  flashButton.installSupportedText = "Cargar en esta placa";
  flashButton.overrides = {
    checkSameFirmware(manifest) {
      return manifest;
    },
  };
  flashButton.addEventListener("state-changed", (event) => {
    const state = event.detail;
    if (state?.state === "writing" && state?.details?.percentage != null) {
      const percent = Math.round(state.details.percentage);
      setProgress(percent, `Cargando firmware a la placa... ${percent}%`, "Carga local");
    } else if (state?.state === "finished") {
      stopFakeProgress(100, "Firmware cargado correctamente desde este equipo.", "Carga local");
      serialStatusEl.textContent = "Carga local completada correctamente.";
    } else if (state?.state === "error") {
      const details = state?.details?.details;
      const message = details?.message || details || "La carga local fallo.";
      stopFakeProgress(0, String(message), "Carga local");
      serialStatusEl.textContent = `La carga local fallo: ${message}`;
    }
  });

  artifactActionsEl.appendChild(flashButton);
}

function renderArtifactResult(data, upload = false) {
  const links = [];
  const artifactUrls = data?.artifact_urls || {};
  const looksLikeLegacyCompiler =
    data?.status === "ok" &&
    !artifactUrls.merged_binary &&
    !data?.flash_manifest &&
    data?.board === "esp32-s3-zero";

  if (artifactUrls.binary) {
    links.push({ label: "Descargar .bin", url: artifactUrls.binary });
  }
  if (artifactUrls.merged_binary) {
    links.push({ label: "Descargar merged .bin", url: artifactUrls.merged_binary });
  }
  if (artifactUrls.sketch) {
    links.push({ label: "Descargar sketch", url: artifactUrls.sketch });
  }
  if (artifactUrls.workspace) {
    links.push({ label: "Descargar workspace", url: artifactUrls.workspace });
  }

  if (data?.status === "ok") {
    if (looksLikeLegacyCompiler) {
      setArtifactState(
        "error",
        [
          "La compilacion termino, pero el compiler service que respondio todavia no expone el artefacto necesario para la carga local desde el navegador.",
          "",
          "Eso normalmente significa que la PC que hace de compilador sigue corriendo una version antigua del backend.",
          "Actualiza esa PC con el ultimo codigo y reinicia el compiler service antes de volver a compilar.",
        ].join("\n"),
        links
      );
      return;
    }

    const summary = upload
      ? data.message || "Compilacion y carga completadas."
      : "Firmware listo. Ahora conecta la placa a este equipo y usa Cargar en esta placa.";
    setArtifactState("ok", summary, links);
    if (!upload) {
      setFlashManifest(data);
    }
    return;
  }

  if (data?.status === "error") {
    setArtifactState("error", data.message || "La operacion no termino correctamente.", links);
    return;
  }

  setArtifactState("idle", "Cuando compiles, aqui apareceran los archivos generados y el siguiente paso recomendado.");
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
  const rememberedCandidates = getStoredCompilerCandidates();
  const rememberedMessage = rememberedCandidates.length
    ? ["", "Endpoints recordados:", ...rememberedCandidates].join("\n")
    : "";

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
      rememberedMessage,
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
    "",
    "Si cambiaste de red, la IP del compilador pudo cambiar.",
    rememberedMessage,
  ].join("\n");
}

function updateUploadAvailability(data = null) {
  const localUploadPossible = isLikelyLocalCompilerEndpoint();
  const compilerAllowsUpload = Boolean(data?.upload_supported);

  if (compilerAllowsUpload && localUploadPossible) {
    uploadButton.dataset.allowed = "true";
    uploadButton.disabled = false;
    uploadButton.title = "";
    return;
  }

  uploadButton.dataset.allowed = "false";
  uploadButton.disabled = true;

  if (compilerAllowsUpload && !localUploadPossible) {
    uploadButton.title =
      "Este compiler endpoint esta en otra maquina. Hoy solo puede subir a la placa conectada a esa maquina, no a la de este equipo.";
    return;
  }

  uploadButton.title = "Este compiler endpoint no permite subida directa por USB.";
}

async function tryCompilerEndpoint(endpoint) {
  const response = await fetch(`${endpoint}/api/health`);
  const rawText = await response.text();
  const data = JSON.parse(rawText);
  return { endpoint, response, data };
}

async function resolveReachableCompiler(preferredEndpoint = null) {
  const candidates = preferredEndpoint
    ? [preferredEndpoint, ...getCompilerCandidateList()]
    : getCompilerCandidateList();

  let lastError = null;

  for (const endpoint of [...new Set(candidates)]) {
    try {
      const result = await tryCompilerEndpoint(endpoint);
      compilerUrlInput.value = endpoint;
      persistCompilerUrl();
      rememberCompilerCandidates([
        endpoint,
        ...(result.data?.recommended_lan_compiler_endpoints || []),
      ]);
      return result;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No se encontro un compiler endpoint disponible.");
}

function setBoardOptions(boards) {
  const entries = Object.entries(boards || {});
  if (!entries.length) {
    return;
  }

  const savedBoardId = window.localStorage.getItem("pixi_board_id") || DEFAULT_BOARD_ID;

  boardSelect.innerHTML = "";

  entries.forEach(([boardId, profile]) => {
    const option = document.createElement("option");
    option.value = boardId;
    option.textContent = profile.label || boardId;
    boardSelect.appendChild(option);
  });

  if (entries.some(([boardId]) => boardId === DEFAULT_BOARD_ID)) {
    boardSelect.value = DEFAULT_BOARD_ID;
  } else if (entries.some(([boardId]) => boardId === savedBoardId)) {
    boardSelect.value = savedBoardId;
  } else {
    boardSelect.value = entries[0][0];
  }

  updateBoardSelectionFromUI(boards);
}

function updateBoardSelectionFromUI(boardsMap = null) {
  const boards = boardsMap || window.pixiBoards || {};
  const desiredBoardId = boardSelect.value || DEFAULT_BOARD_ID;
  const profile = boards[desiredBoardId];
  if (!profile) {
    return;
  }

  window.pixiBoards = boards;
  boardSelect.value = desiredBoardId;
  fqbnInput.value = profile.fqbn || DEFAULT_FQBN;
  window.localStorage.setItem("pixi_board_id", desiredBoardId);

  const portsByBoard = getSavedPortsByBoard();
  if (portsByBoard[desiredBoardId]) {
    portInput.value = portsByBoard[desiredBoardId];
  }
  updateRuntimeHints(lastCompilerHealth);
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
  stopFakeProgress(5, upload ? "Preparando compilacion y subida desde el compilador..." : "Preparando compilacion...");
  const target = upload ? 90 : 82;
  progressTimer = window.setInterval(() => {
    const increment = progressValue < 20 ? 4 : progressValue < 50 ? 2.5 : 0.8;
    if (progressValue < target) {
      setProgress(
        progressValue + increment,
        upload ? "Compilando y usando el puerto USB del compilador..." : "Compilando el proyecto..."
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
    if (shouldReplaceCompilerUrlWithSameOrigin(data)) {
      compilerUrlInput.value = window.location.origin;
      persistCompilerUrl();
    } else if (data.recommended_compiler_endpoint && !isFrontendDevServer && !savedCompilerUrl) {
      compilerUrlInput.value = data.recommended_compiler_endpoint;
      persistCompilerUrl();
    }
    updateRuntimeHints(data);
  } catch (error) {
    backendStatusEl.textContent = `No se pudo conectar al backend: ${error.message}`;
  }
}

async function checkCompiler() {
  persistCompilerUrl();

  if (isInsecureCompilerEndpointFromSecurePage()) {
    serialStatusEl.textContent = "No se puede probar un compiler endpoint HTTP desde la pagina HTTPS de Render.";
    backendResponseEl.textContent = getCompilerEndpointErrorMessage();
    updateUploadAvailability(null);
    uploadButton.title = "Abre la version local de la web o usa un compiler endpoint con HTTPS.";
    return;
  }

  try {
    const { data } = await resolveReachableCompiler(getCompilerUrl());
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
    updateUploadAvailability(data);
    if (data.boards) {
      setBoardOptions(data.boards);
    }
    updateRuntimeHints(data);
    await refreshDetectedPorts();
  } catch (error) {
    serialStatusEl.textContent = `No se pudo conectar al compiler endpoint: ${error.message}`;
    backendResponseEl.textContent = getCompilerEndpointErrorMessage();
    updateUploadAvailability(null);
    updateRuntimeHints(lastCompilerHealth);
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
    lastDetectedPorts = ports;
    if (!ports.length) {
      updateRuntimeHints(lastCompilerHealth);
      return;
    }

    const currentBoard = boardSelect.value || DEFAULT_BOARD_ID;
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
    updateRuntimeHints(lastCompilerHealth);
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
    setArtifactState("idle", "Todavia no hay compilacion porque el proyecto no tiene bloques conectados.");
    return;
  }

  if (upload && !isLikelyLocalCompilerEndpoint()) {
    backendResponseEl.textContent = [
      "La subida directa por USB no puede hacerse usando un compiler endpoint que esta en otra maquina.",
      "",
      "Lo que si funciona hoy:",
      "1. compilar en remoto",
      "2. descargar el .bin generado",
      "3. preparar una carga local desde este equipo",
      "",
      "Si quieres que la subida funcione ahora mismo, usa un compiler endpoint local como https://localhost:5443 en esta misma maquina.",
    ].join("\n");
    setArtifactState(
      "error",
      "La compilacion remota puede funcionar, pero la carga USB todavia depende de una accion local en el equipo donde esta conectada la placa."
    );
    stopFakeProgress(0, "La subida remota no esta disponible en este flujo.", "Carga desde compilador");
    return;
  }

  if (isInsecureCompilerEndpointFromSecurePage()) {
    backendResponseEl.textContent = getCompilerEndpointErrorMessage();
    serialStatusEl.textContent = "La compilacion desde Render hacia un compiler endpoint HTTP local esta bloqueada por el navegador.";
    stopFakeProgress(0, "Conexion bloqueada antes de iniciar.", upload ? "Carga desde compilador" : "Compilar");
    setArtifactState("error", "La conexion al compilador local fue bloqueada antes de crear artefactos.");
    return;
  }

  try {
    setBusyState(true);
    startFakeProgress(upload);
    await resolveReachableCompiler(getCompilerUrl());
    const response = await fetch(`${getCompilerUrl()}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_name: normalizeProjectName(),
        board: boardSelect.value || DEFAULT_BOARD_ID,
        fqbn: fqbnInput.value.trim() || DEFAULT_FQBN,
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
      renderArtifactResult(data, upload);
      if (data.resolved_port) {
        portInput.value = data.resolved_port;
        savePortForBoard(boardSelect.value, data.resolved_port);
      }
      if (Array.isArray(data.detected_ports)) {
        lastDetectedPorts = data.detected_ports;
      }
      updateRuntimeHints(lastCompilerHealth);
      stopFakeProgress(
        data.status === "ok" ? 100 : 0,
        data.message || "Proceso finalizado.",
        upload ? "Compilar y subir desde el compilador" : "Compilar"
      );
    } catch {
      backendResponseEl.textContent = `El backend no devolvio JSON.\n\nHTTP ${response.status}\n\n${rawText}`;
      stopFakeProgress(0, "La operacion termino con una respuesta inesperada.", upload ? "Compilar y subir desde el compilador" : "Compilar");
      setArtifactState("error", "La compilacion respondio de forma inesperada y no se pudieron interpretar artefactos.");
    }
  } catch (error) {
    backendResponseEl.textContent = `Error enviando al backend: ${error.message}\n\n${getCompilerEndpointErrorMessage()}`;
    stopFakeProgress(0, `Error: ${error.message}`, upload ? "Compilar y subir desde el compilador" : "Compilar");
    setArtifactState("error", "No se pudo completar la solicitud al compilador.");
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
compilerUrlInput.addEventListener("input", () => {
  updateUploadAvailability(lastCompilerHealth);
  updateRuntimeHints(lastCompilerHealth);
});
saveProjectButton.addEventListener("click", saveProjectToBrowser);
loadProjectButton.addEventListener("click", loadProjectFromBrowser);

checkBackend();
checkCompiler();
setProgress(0, "Sin actividad.");
setArtifactState("idle", "Cuando compiles, aqui apareceran los archivos generados y el siguiente paso recomendado.");
updateUploadAvailability(null);
