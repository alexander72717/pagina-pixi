let workspace = null;
let port = null;
let esploader = null;

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 120000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        const responseText = await response.text();
        let payload = null;

        try {
            payload = responseText ? JSON.parse(responseText) : null;
        } catch (parseError) {
            throw new Error(`El servidor respondio, pero no devolvio JSON valido. HTTP ${response.status}.`);
        }

        if (!response.ok) {
            const details = payload?.details || payload?.message || `HTTP ${response.status}`;
            throw new Error(details);
        }

        return payload;
    } catch (err) {
        if (err.name === "AbortError") {
            throw new Error("El servidor tardo demasiado en responder. Revisa si la app de CasaOS sigue encendida o si la compilacion quedo trabada.");
        }

        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}

// ==========================================================================
// 1. REGISTRO DE BLOQUES PERSONALIZADOS
// ==========================================================================
function registerCustomBlocks() {

    Blockly.Blocks['esp32_on_start'] = {
        init: function() {
            this.appendDummyInput().appendField("🏁 al iniciar ESP32");
            this.appendStatementInput("SETUP_CODE").setCheck(null);
            this.setColour("#4cb050");
        }
    };

    Blockly.Blocks['esp32_main_loop'] = {
        init: function() {
            this.appendDummyInput().appendField("🔄 por siempre (bucle)");
            this.appendStatementInput("LOOP_CODE").setCheck(null);
            this.setColour("#4cb050");
        }
    };

    Blockly.Blocks['esp32_servo_move'] = {
        init: function() {
            this.appendValueInput("ANGLE")
                .setCheck("Number")
                .appendField("⚙️ mover Servo Pin")
                .appendField(new Blockly.FieldDropdown([
                    ["GPIO 13", "13"], ["GPIO 12", "12"], ["GPIO 14", "14"]
                ]), "PIN")
                .appendField("a °");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#2196f3");
        }
    };

    Blockly.Blocks['esp32_motor_dc'] = {
        init: function() {
            this.appendValueInput("SPEED")
                .setCheck("Number")
                .appendField("🚗 Motor IN1")
                .appendField(new Blockly.FieldDropdown([["GPIO 26", "26"], ["GPIO 14", "14"]]), "IN1")
                .appendField("IN2")
                .appendField(new Blockly.FieldDropdown([["GPIO 27", "27"], ["GPIO 12", "12"]]), "IN2")
                .appendField("dir")
                .appendField(new Blockly.FieldDropdown([["Adelante ⏩", "FORWARD"], ["Atrás ⏪", "BACKWARD"]]), "DIR")
                .appendField("vel");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#2196f3");
        }
    };

    Blockly.Blocks['esp32_motor_stop'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("🛑 detener Motor IN1")
                .appendField(new Blockly.FieldDropdown([["GPIO 26", "26"], ["GPIO 14", "14"]]), "IN1")
                .appendField("IN2")
                .appendField(new Blockly.FieldDropdown([["GPIO 27", "27"], ["GPIO 12", "12"]]), "IN2");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#2196f3");
        }
    };

    Blockly.Blocks['esp32_digital_write'] = {
        init: function() {
            this.appendDummyInput()
                .appendField("💡 poner Pin")
                .appendField(new Blockly.FieldDropdown([
                    ["GPIO 21 (LED S3 Zero)", "21"], ["GPIO 2", "2"], ["GPIO 4", "4"]
                ]), "PIN")
                .appendField("en")
                .appendField(new Blockly.FieldDropdown([["HIGH", "HIGH"], ["LOW", "LOW"]]), "STATE");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour("#2196f3");
        }
    };

    // GENERADORES
    const gen = Blockly.JavaScript || (window.javascript && window.javascript.javascriptGenerator);

    if (gen) {
        const setGen = (name, fn) => {
            gen[name] = fn;
            if (gen.forBlock) gen.forBlock[name] = fn;
        };

        setGen('esp32_on_start', (b, g) => (g || gen).statementToCode(b, 'SETUP_CODE'));
        setGen('esp32_main_loop', (b, g) => (g || gen).statementToCode(b, 'LOOP_CODE'));

        setGen('esp32_servo_move', (b, g) => {
            const pin = b.getFieldValue('PIN');
            const angle = (g || gen).valueToCode(b, 'ANGLE', (g || gen).ORDER_ATOMIC) || '90';
            return `servo_${pin}.write(${angle});\n`;
        });

        setGen('esp32_motor_dc', (b, g) => {
            const in1 = b.getFieldValue('IN1');
            const in2 = b.getFieldValue('IN2');
            const dir = b.getFieldValue('DIR');
            const speed = (g || gen).valueToCode(b, 'SPEED', (g || gen).ORDER_ATOMIC) || '255';
            return dir === 'FORWARD' 
                ? `analogWrite(${in1}, ${speed});\ndigitalWrite(${in2}, LOW);\n`
                : `digitalWrite(${in1}, LOW);\nanalogWrite(${in2}, ${speed});\n`;
        });

        setGen('esp32_motor_stop', b => `digitalWrite(${b.getFieldValue('IN1')}, LOW);\ndigitalWrite(${b.getFieldValue('IN2')}, LOW);\n`);
        setGen('esp32_digital_write', b => `digitalWrite(${b.getFieldValue('PIN')}, ${b.getFieldValue('STATE')});\n`);
    }
}

// ==========================================================================
// 2. INICIALIZACIÓN DE WORKSPACE
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    registerCustomBlocks();
    setTimeout(initBlockly, 100);
    setupEvents();
});

function initBlockly() {
    const blocklyDiv = document.getElementById("blockly-div");
    const toolboxXml = document.getElementById("toolbox");

    if (!blocklyDiv || !toolboxXml) return;

    try {
        workspace = Blockly.inject(blocklyDiv, {
            toolbox: toolboxXml,
            scrollbars: true,
            trashcan: true,
            zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
            grid: { spacing: 20, length: 3, colour: '#ccc', snap: true }
        });

        window.addEventListener('resize', () => Blockly.svgResize(workspace));
        setTimeout(() => Blockly.svgResize(workspace), 300);

        workspace.addChangeListener(updateCode);
        logTerminal("[Sistema] IDE cargado correctamente.");
    } catch (err) {
        console.error("[Error] Falla al inicializar Blockly:", err);
    }
}

// ==========================================================================
// 3. TRADUCCIÓN A C++
// ==========================================================================
function updateCode() {
    if (!workspace) return;

    try {
        const gen = Blockly.JavaScript || (window.javascript && window.javascript.javascriptGenerator);
        if (!gen) return;

        let setupCode = "";
        let loopCode = "";

        workspace.getTopBlocks(true).forEach(block => {
            if (block.type === 'esp32_on_start') setupCode += gen.statementToCode(block, 'SETUP_CODE');
            if (block.type === 'esp32_main_loop') loopCode += gen.statementToCode(block, 'LOOP_CODE');
        });

        let includes = new Set();
        let globalVars = new Set();
        let autoPinModes = new Set();

        const fullBody = setupCode + loopCode;

        for (const match of fullBody.matchAll(/servo_(\d+)/g)) {
            const pin = match[1];
            includes.add("#include <ESP32Servo.h>");
            globalVars.add(`Servo servo_${pin};`);
            autoPinModes.add(`  servo_${pin}.attach(${pin});`);
        }

        for (const match of fullBody.matchAll(/digitalWrite\((\d+),/g)) {
            autoPinModes.add(`  pinMode(${match[1]}, OUTPUT);`);
        }

        let fullCode = `// --- PIXI BLOCKS LAB ESP32-S3 ---\n\n`;
        includes.forEach(inc => fullCode += `${inc}\n`);
        if (includes.size > 0) fullCode += `\n`;

        globalVars.forEach(v => fullCode += `${v}\n`);
        if (globalVars.size > 0) fullCode += `\n`;

        fullCode += `void setup() {\n  Serial.begin(115200);\n`;
        autoPinModes.forEach(pm => fullCode += `${pm}\n`);

        if (setupCode.trim()) fullCode += setupCode.split('\n').map(l => l.trim() ? "  " + l : '').join('\n');
        fullCode += `}\n\nvoid loop() {\n`;
        if (loopCode.trim()) fullCode += loopCode.split('\n').map(l => l.trim() ? "  " + l : '').join('\n');
        fullCode += `}`;

        window.lastGeneratedCode = fullCode;

        const terminalOutput = document.getElementById("terminal-output");
        if (terminalOutput) {
            terminalOutput.innerHTML = `<div style="color: #34d399; font-family: monospace;">${fullCode.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>").replace(/  /g, "&nbsp;&nbsp;")}</div>`;
        }
    } catch (e) {}
}

// ==========================================================================
// 4. CONEXIÓN Y CARGA REAL CON ESPTOOL-JS
// ==========================================================================
function setupEvents() {
    document.getElementById("btn-connect")?.addEventListener("click", connectESP32);
    document.getElementById("btn-upload")?.addEventListener("click", uploadToESP32S3);
    document.getElementById("btn-clear-terminal")?.addEventListener("click", () => {
        document.getElementById("terminal-output").innerHTML = `<span style="color:#60a5fa;">[Sistema] Terminal limpia.</span>`;
    });
}

async function connectESP32() {
    if (!window.isSecureContext) {
        alert(
            "Para conectar la ESP32 por USB debes abrir Pixi con HTTPS.\n\n" +
            "Usa la URL publica de Tailscale Funnel, por ejemplo:\n" +
            "https://servidor-spixers.tailc32d79.ts.net/\n\n" +
            "La direccion http://100.92.146.126:8080 sirve para ver la pagina, " +
            "pero el navegador bloquea Web Serial en HTTP."
        );
        logTerminal("[Error] Web Serial requiere HTTPS o localhost. Abre Pixi desde la URL HTTPS de Tailscale Funnel.");
        return;
    }

    if (!("serial" in navigator)) {
        alert(
            "Tu navegador no permite Web Serial.\n\n" +
            "Abre Pixi en Google Chrome o Microsoft Edge actualizado."
        );
        return;
    }

    try {
        logTerminal("[Sistema] Selecciona el puerto USB de tu ESP32-S3-Zero...");
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        logTerminal("[Éxito] ¡Conectado mediante Web Serial!");
    } catch (err) {
        logTerminal(`[Error] Conexión cancelada: ${err.message}`);
    }
}

async function uploadToESP32S3() {
    if (!port) {
        alert("Primero presiona 'Conectar ESP32'.");
        return;
    }

    const code = window.lastGeneratedCode;
    if (!code) {
        alert("El workspace está vacío.");
        return;
    }

    logTerminal("--------------------------------------------------");
    logTerminal("[1/4] Verificando conexion con el servidor de compilacion...");

    try {
        const health = await fetchJsonWithTimeout('/api/health', {}, 10000);
        logTerminal(`[OK] Servidor conectado. Placa objetivo: ${health.fqbn || "ESP32"}.`);
        logTerminal("[2/4] Enviando C++ al servidor de compilacion...");

        const data = await fetchJsonWithTimeout('/api/compile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        }, 180000);

        if (!data.success) {
            logTerminal(`[Error Compilación]:\n${data.details || data.message}`);
            if (data.compile_result?.command) {
                logTerminal(`[Comando]: ${data.compile_result.command.join(" ")}`);
            }
            return;
        }

        logTerminal("[Éxito] Compilación exitosa. Binario recibido.");
        logTerminal("[3/4] Conectando con ESP32-S3...");

        const esptool = window.esptooljs || window.esptool;
        const Transport = esptool?.Transport || window.Transport;
        const ESPLoader = esptool?.ESPLoader || window.ESPLoader;

        const transport = new Transport(port);
        const loaderOptions = {
            transport: transport,
            baudrate: 115200,
            terminal: {
                clean: () => {},
                writeLine: (msg) => logTerminal(`[esptool]: ${msg}`),
                write: (msg) => logTerminal(`[esptool]: ${msg}`)
            }
        };

        esploader = new ESPLoader(loaderOptions);
        await esploader.main();

        const flashData = data.bins?.merged || data.bins?.app;
        if (!flashData) {
            logTerminal("[Error] El servidor compilo, pero no devolvio ningun binario para cargar.");
            return;
        }

        const flashAddress = data.flash?.address ?? (data.bins.merged ? 0x0 : 0x10000);
        const flashLabel = data.bins.merged ? "binario completo" : "aplicacion";

        logTerminal(`[4/4] Escribiendo ${flashLabel} en memoria Flash (${flashAddress.toString(16)})...`);

        const appBinString = atob(flashData);
        const appBinArray = Uint8Array.from(appBinString, c => c.charCodeAt(0));

        await esploader.writeFlash({
            fileArray: [{ data: appBinArray, address: flashAddress }],
            flashSize: 'keep',
            eraseAll: false,
            compress: true
        });

        logTerminal("[Éxito] ¡PROGRAMA CARGADO CORRECTAMENTE EN LA ESP32-S3! 🎉");
        logTerminal("--------------------------------------------------");

    } catch (err) {
        logTerminal(`[Error de Carga]: ${err.message}`);
        logTerminal("Si se quedo en la verificacion o compilacion, abre /api/health en la misma URL para confirmar que CasaOS responde.");
    }
}

function logTerminal(message) {
    const terminalOutput = document.getElementById("terminal-output");
    if (!terminalOutput) return;

    const div = document.createElement("div");
    div.style.fontFamily = "monospace";
    div.style.color = message.includes("[Error]") ? "#ef4444" : message.includes("[Éxito]") ? "#34d399" : "#60a5fa";
    div.textContent = message;

    terminalOutput.appendChild(div);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}
