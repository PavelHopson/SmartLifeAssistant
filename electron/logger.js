// Desktop file-based logger for diagnostics and beta debugging
const fs = require("fs");
const path = require("path");

const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_LOG_FILES = 3;

let logDir = null;
let logStream = null;

function init(userDataPath) {
  logDir = path.join(userDataPath, "logs");
  try { fs.mkdirSync(logDir, { recursive: true }); } catch {}
  rotateIfNeeded();
  openStream();
}

function getLogPath() {
  return path.join(logDir, "desktop.log");
}

function rotateIfNeeded() {
  const logPath = getLogPath();
  try {
    if (!fs.existsSync(logPath)) return;
    const stats = fs.statSync(logPath);
    if (stats.size < MAX_LOG_SIZE) return;

    // Rotate: desktop.log → desktop.1.log → desktop.2.log
    for (let i = MAX_LOG_FILES - 1; i >= 1; i--) {
      const from = i === 1 ? logPath : path.join(logDir, `desktop.${i - 1}.log`);
      const to = path.join(logDir, `desktop.${i}.log`);
      try { if (fs.existsSync(from)) fs.renameSync(from, to); } catch {}
    }
  } catch {}
}

function openStream() {
  try {
    logStream = fs.createWriteStream(getLogPath(), { flags: "a" });
  } catch {}
}

function write(level, module, message, data) {
  const timestamp = new Date().toISOString();
  const entry = data
    ? `[${timestamp}] [${level}] [${module}] ${message} ${JSON.stringify(data)}`
    : `[${timestamp}] [${level}] [${module}] ${message}`;

  // Console
  if (level === "ERROR") console.error(entry);
  else if (level === "WARN") console.warn(entry);
  else console.log(entry);

  // File
  if (logStream) {
    try { logStream.write(entry + "\n"); } catch {}
  }
}

function close() {
  if (logStream) {
    try { logStream.end(); } catch {}
    logStream = null;
  }
}

function getRecentLogs(lines = 100) {
  try {
    const content = fs.readFileSync(getLogPath(), "utf-8");
    return content.split("\n").filter(Boolean).slice(-lines);
  } catch {
    return [];
  }
}

module.exports = {
  init,
  info: (mod, msg, data) => write("INFO", mod, msg, data),
  warn: (mod, msg, data) => write("WARN", mod, msg, data),
  error: (mod, msg, data) => write("ERROR", mod, msg, data),
  close,
  getRecentLogs,
  getLogDir: () => logDir,
};
