const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const FQBN = process.env.PIXI_FQBN || 'esp32:esp32:esp32s3';
const ARDUINO_CONFIG_FILE = process.env.ARDUINO_CONFIG_FILE || '/etc/arduino-cli.yaml';

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function runArduinoCli(args) {
    return new Promise((resolve) => {
        const finalArgs = ARDUINO_CONFIG_FILE
            ? ['--config-file', ARDUINO_CONFIG_FILE, ...args]
            : args;

        execFile('arduino-cli', finalArgs, { windowsHide: true }, (error, stdout, stderr) => {
            resolve({
                ok: !error,
                command: ['arduino-cli', ...finalArgs],
                stdout,
                stderr,
                code: error?.code ?? 0,
                message: error?.message || ''
            });
        });
    });
}

function readBase64IfExists(filePath) {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath).toString('base64');
}

app.get('/api/health', async (_req, res) => {
    const versionResult = await runArduinoCli(['version']);

    res.json({
        status: 'ok',
        message: 'Pixi Blocks Lab listo.',
        service: 'node-casaos',
        fqbn: FQBN,
        arduino_cli: {
            available: versionResult.ok,
            version: versionResult.stdout.trim() || versionResult.stderr.trim() || versionResult.message
        }
    });
});

app.post('/api/compile', async (req, res) => {
    const cppCode = req.body?.code;

    if (!cppCode || typeof cppCode !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'No se envio codigo C++ para compilar.'
        });
    }

    const buildDir = path.join(__dirname, 'build_temp');
    const sketchDir = path.join(buildDir, 'sketch');
    const sketchPath = path.join(sketchDir, 'sketch.ino');

    fs.mkdirSync(sketchDir, { recursive: true });
    fs.writeFileSync(sketchPath, cppCode, 'utf8');

    console.log(`[Pixi] Compilando sketch para ${FQBN}...`);

    const compileResult = await runArduinoCli([
        'compile',
        '--fqbn',
        FQBN,
        '--output-dir',
        buildDir,
        sketchDir
    ]);

    if (!compileResult.ok) {
        console.error('[Pixi] Error de compilacion:', compileResult.stderr || compileResult.stdout);
        return res.status(500).json({
            success: false,
            message: 'Error al compilar el codigo C++.',
            details: compileResult.stderr || compileResult.stdout || compileResult.message,
            compile_result: compileResult
        });
    }

    const appBinPath = path.join(buildDir, 'sketch.ino.bin');
    const mergedBinPath = path.join(buildDir, 'sketch.ino.merged.bin');
    const appBin = readBase64IfExists(appBinPath);
    const mergedBin = readBase64IfExists(mergedBinPath);

    if (!appBin && !mergedBin) {
        return res.status(500).json({
            success: false,
            message: 'La compilacion termino, pero no se encontro el archivo .bin generado.',
            compile_result: compileResult
        });
    }

    console.log('[Pixi] Compilacion completada.');

    res.json({
        success: true,
        message: 'Sketch compilado correctamente.',
        fqbn: FQBN,
        flash: mergedBin
            ? { strategy: 'merged', address: 0x0 }
            : { strategy: 'app', address: 0x10000 },
        bins: {
            app: appBin,
            merged: mergedBin
        },
        compile_result: compileResult
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pixi Blocks Lab listo en http://0.0.0.0:${PORT}`);
});
