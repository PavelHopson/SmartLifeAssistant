const { app, BrowserWindow, Tray, Menu, shell, nativeImage, Notification, ipcMain } = require("electron");
const { spawn, execSync } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");
const log = require("./logger");
const { canSendNotification, recordNotification } = require("./throttle");
const { showFirstRun } = require("./first-run");

// ─── Config ─────────────────────────────────────────

const PORT = 3000;
const APP_URL = `http://localhost:${PORT}`;
const IS_DEV = !app.isPackaged;
const APP_DIR = IS_DEV ? process.cwd() : path.join(process.resourcesPath, "app");
const USER_DATA = app.getPath("userData");
const STATE_FILE = path.join(USER_DATA, "window-state.json");
const SETTINGS_FILE = path.join(USER_DATA, "desktop-settings.json");
const FIRST_RUN_FILE = path.join(USER_DATA, ".first-run-done");
const REMINDER_INTERVAL = 60_000;

// Init logger
log.init(USER_DATA);
log.info("APP", `Starting (${IS_DEV ? "dev" : "prod"})`, { version: app.getVersion() });

let mainWindow = null;
let splashWindow = null;
let tray = null;
let serverProcess = null;
let isQuitting = false;
let lastRoute = "/dashboard";
let reminderTimer = null;
let lastNotifiedId = "";
let desktopSettings = loadDesktopSettings();

// ─── Single Instance Lock ───────────────────────────

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── Desktop Settings ───────────────────────────────

function loadDesktopSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
    }
  } catch {}
  return {
    autoLaunch: false,
    startMinimized: false,
    closeToTray: true,
    notificationSound: true,
    showOverdueInTray: true,
    backgroundReminders: true,
    quietHoursStart: null,
    quietHoursEnd: null,
  };
}

function saveDesktopSettings() {
  try { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(desktopSettings, null, 2)); } catch {}
}

// ─── Auto Launch ────────────────────────────────────

async function setupAutoLaunch() {
  try {
    const AutoLaunch = require("auto-launch");
    const launcher = new AutoLaunch({ name: "Smart Life Assistant", isHidden: desktopSettings.startMinimized });
    const enabled = await launcher.isEnabled();
    if (desktopSettings.autoLaunch && !enabled) await launcher.enable();
    if (!desktopSettings.autoLaunch && enabled) await launcher.disable();
  } catch (err) {
    console.error("[AUTOLAUNCH]", err.message);
  }
}

// ─── Window State ───────────────────────────────────

function loadWindowState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const d = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));
      if (d.lastRoute) lastRoute = d.lastRoute;
      return d;
    }
  } catch {}
  return { width: 1280, height: 860 };
}

function saveWindowState() {
  try {
    const b = mainWindow?.getBounds() || {};
    const url = mainWindow?.webContents?.getURL() || "";
    fs.writeFileSync(STATE_FILE, JSON.stringify({
      width: b.width || 1280, height: b.height || 860, x: b.x, y: b.y,
      lastRoute: url.replace(APP_URL, "") || "/dashboard",
    }));
  } catch {}
}

// ─── Native Notifications ───────────────────────────

function showNativeNotification(title, body, route) {
  if (!Notification.isSupported()) return;
  const settings = { ...desktopSettings };
  if (!canSendNotification(settings)) { log.info("NOTIF", "Throttled", { title }); return; }
  recordNotification();
  const n = new Notification({ title, body, icon: getIconPath("icon-256"), silent: !desktopSettings.notificationSound });
  n.on("click", () => {
    log.info("NOTIF", "Clicked", { route });
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); if (route) mainWindow.loadURL(`${APP_URL}${route}`); }
  });
  n.show();
  log.info("NOTIF", "Shown", { title });
}

// ─── Background Reminders ───────────────────────────

function startReminderChecks() {
  if (!desktopSettings.backgroundReminders) return;
  reminderTimer = setInterval(async () => {
    try {
      const notifs = await fetchJSON(`${APP_URL}/api/notifications`);
      if (!notifs?.notifications) return;

      const unread = notifs.notifications.filter(n => !n.readAt && n.status === "sent");
      if (unread.length > 0 && unread[0].id !== lastNotifiedId) {
        lastNotifiedId = unread[0].id;
        const route = getNotifRoute(unread[0]);
        showNativeNotification(unread[0].title, unread[0].body, route);
      }

      if (desktopSettings.showOverdueInTray) updateTrayMenu();
    } catch {}
  }, REMINDER_INTERVAL);
}

function stopReminderChecks() { if (reminderTimer) { clearInterval(reminderTimer); reminderTimer = null; } }

function getNotifRoute(notif) {
  const type = typeof notif === "string" ? notif : notif?.type;
  const entityType = notif?.relatedEntityType;
  const kind = notif?.payload?.kind;

  // Health-related actions → /health or /actions
  if (entityType === "ai_action" && kind && kind.startsWith("health_")) return "/health";

  // Entity-aware routing
  if (entityType === "task") return "/tasks";
  if (entityType === "ai_action") return "/actions";
  if (entityType === "subscription") return "/subscriptions";

  // Type-based fallback
  const typeRoutes = {
    savings_detected: "/wow",
    action_requires_manual_step: "/actions",
    action_completed: "/actions",
    action_generated: "/actions",
    reminder_due: "/tasks",
    end_of_day_summary: "/dashboard",
  };
  return typeRoutes[type] || "/notifications";
}

function fetchJSON(url) {
  return new Promise(resolve => {
    const req = http.get(url, res => {
      let body = ""; res.on("data", c => body += c);
      res.on("end", () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
    });
    req.on("error", () => resolve(null));
    req.setTimeout(5000, () => { req.destroy(); resolve(null); });
  });
}

// ─── Dynamic Tray ───────────────────────────────────

let unreadBadgeCount = 0;

async function updateTrayMenu() {
  if (!tray) return;

  // Fetch unread count
  try { const d = await fetchJSON(`${APP_URL}/api/notifications/count`); if (d) unreadBadgeCount = d.count || 0; } catch {}

  const badge = unreadBadgeCount > 0 ? ` (${unreadBadgeCount})` : "";
  const items = [
    { label: `Открыть Smart Life${badge}`, click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { type: "separator" },
    { label: "Главная", click: () => nav("/dashboard") },
    { label: "Задачи", click: () => nav("/tasks") },
    { label: "Действия", click: () => nav("/actions") },
    { label: `Уведомления${badge}`, click: () => nav("/notifications") },
  ];

  if (desktopSettings.showOverdueInTray) {
    try {
      const d = await fetchJSON(`${APP_URL}/api/tasks?status=open`);
      if (d?.tasks) {
        const now = new Date();
        const overdue = d.tasks.filter(t => t.dueAt && new Date(t.dueAt) < now && t.status !== "done").slice(0, 3);
        if (overdue.length > 0) {
          items.push({ type: "separator" });
          items.push({ label: `⚠ Просрочено (${overdue.length})`, enabled: false });
          overdue.forEach(t => items.push({ label: `  ${t.title}`, click: () => nav("/tasks") }));
        }
      }
    } catch {}
  }

  items.push({ type: "separator" });
  items.push({ label: "Настройки", click: () => showDesktopSettings() });
  items.push({ label: "Открыть логи", click: () => { const dir = log.getLogDir(); if (dir) shell.openPath(dir); } });
  items.push({ type: "separator" });
  items.push({ label: "Выйти", click: () => { isQuitting = true; saveWindowState(); stopServer(); app.quit(); } });

  tray.setContextMenu(Menu.buildFromTemplate(items));
  tray.setToolTip(`Smart Life Assistant${badge}`);
}

function nav(route) { if (mainWindow) { mainWindow.show(); mainWindow.focus(); mainWindow.loadURL(`${APP_URL}${route}`); } }

// ─── Desktop Settings Window ────────────────────────

function showDesktopSettings() {
  const win = new BrowserWindow({
    width: 420, height: 500, frame: true, resizable: false,
    title: "Настройки", backgroundColor: "#18181b",
    parent: mainWindow || undefined, modal: !!mainWindow,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });
  win.setMenuBarVisibility(false);

  const s = desktopSettings;
  const html = `data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#18181b;color:#fafafa;font-family:system-ui,-apple-system,sans-serif;padding:24px}
h2{font-size:16px;margin-bottom:20px;font-weight:600}
.o{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #262626}
.o:last-of-type{border:none}.l{font-size:13px}.d{font-size:11px;color:#737373;margin-top:2px}
.t{position:relative;width:40px;height:22px;cursor:pointer}
.t input{opacity:0;width:0;height:0}
.s{position:absolute;inset:0;background:#333;border-radius:11px;transition:.2s}
.s:before{content:"";position:absolute;height:16px;width:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s}
input:checked+.s{background:#2563eb}input:checked+.s:before{transform:translateX(18px)}
.btn{display:block;width:100%;padding:10px;margin-top:20px;border:none;border-radius:8px;background:#2563eb;color:#fff;font-size:13px;font-weight:600;cursor:pointer}
</style></head><body>
<h2>Настройки рабочего стола</h2>
<div class="o"><div><div class="l">Запуск при входе в Windows</div><div class="d">Приложение запустится автоматически</div></div><label class="t"><input type="checkbox" id="a" ${s.autoLaunch?"checked":""}><span class="s"></span></label></div>
<div class="o"><div><div class="l">Запускать свёрнутым</div><div class="d">Только иконка в трее</div></div><label class="t"><input type="checkbox" id="b" ${s.startMinimized?"checked":""}><span class="s"></span></label></div>
<div class="o"><div><div class="l">Сворачивать в трей</div><div class="d">При закрытии окна</div></div><label class="t"><input type="checkbox" id="c" ${s.closeToTray?"checked":""}><span class="s"></span></label></div>
<div class="o"><div><div class="l">Звук уведомлений</div></div><label class="t"><input type="checkbox" id="d" ${s.notificationSound?"checked":""}><span class="s"></span></label></div>
<div class="o"><div><div class="l">Фоновые напоминания</div><div class="d">Проверять задачи в фоне</div></div><label class="t"><input type="checkbox" id="e" ${s.backgroundReminders?"checked":""}><span class="s"></span></label></div>
<div class="o"><div><div class="l">Просроченные в трее</div><div class="d">В контекстном меню</div></div><label class="t"><input type="checkbox" id="f" ${s.showOverdueInTray?"checked":""}><span class="s"></span></label></div>
<div style="padding:12px 0;border-bottom:1px solid #262626"><div class="l" style="margin-bottom:8px">Тихие часы (не беспокоить)</div><div style="display:flex;gap:8px"><input type="time" id="qs" value="${s.quietHoursStart||""}" style="flex:1;height:32px;padding:0 8px;border:1px solid #333;border-radius:6px;background:#262626;color:#fafafa;font-size:12px"><input type="time" id="qe" value="${s.quietHoursEnd||""}" style="flex:1;height:32px;padding:0 8px;border:1px solid #333;border-radius:6px;background:#262626;color:#fafafa;font-size:12px"></div></div>
<button class="btn" onclick="save()">Сохранить</button>
<script>
const{ipcRenderer}=require("electron");
function save(){ipcRenderer.send("dss",{autoLaunch:a.checked,startMinimized:b.checked,closeToTray:c.checked,notificationSound:d.checked,backgroundReminders:e.checked,showOverdueInTray:f.checked,quietHoursStart:qs.value||null,quietHoursEnd:qe.value||null});window.close()}
</script></body></html>`)}`;
  win.loadURL(html);
}

ipcMain.on("dss", (_, s) => {
  desktopSettings = s;
  saveDesktopSettings();
  setupAutoLaunch();
  stopReminderChecks();
  if (s.backgroundReminders) startReminderChecks();
  updateTrayMenu();
});

// ─── Splash ─────────────────────────────────────────

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 400, height: 300, frame: false, resizable: false,
    alwaysOnTop: true, skipTaskbar: true, backgroundColor: "#18181b",
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}body{background:#18181b;color:#fafafa;font-family:system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;user-select:none}
.logo{width:80px;height:80px;border-radius:20px;background:#2563eb22;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#2563eb;margin-bottom:24px}
h1{font-size:20px;font-weight:600;margin-bottom:8px}.st{font-size:13px;color:#a3a3a3;margin-top:4px}
.sp{width:24px;height:24px;border:3px solid #333;border-top-color:#2563eb;border-radius:50%;animation:s .8s linear infinite;margin-top:20px}@keyframes s{to{transform:rotate(360deg)}}
</style></head><body><div class="logo">SL</div><h1>Smart Life Assistant</h1><div class="st" id="s">Запуск...</div><div class="sp"></div></body></html>`)}`);
}

function updateSplash(t) {
  if (splashWindow && !splashWindow.isDestroyed())
    splashWindow.webContents.executeJavaScript(`document.getElementById("s").textContent=${JSON.stringify(t)}`).catch(() => {});
}

function closeSplash() { if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close(); splashWindow = null; }

// ─── Error Screen ───────────────────────────────────

function showError(title, details) {
  closeSplash();
  const w = new BrowserWindow({ width: 500, height: 380, frame: true, resizable: false, backgroundColor: "#18181b", webPreferences: { nodeIntegration: false, contextIsolation: true } });
  w.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}body{background:#18181b;color:#fafafa;font-family:system-ui,-apple-system,sans-serif;padding:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh}
.i{font-size:48px;margin-bottom:16px}h1{font-size:18px;margin-bottom:12px;text-align:center}
.d{font-size:13px;color:#a3a3a3;text-align:center;line-height:1.6;margin-bottom:24px}
.h{font-size:12px;color:#737373;background:#262626;padding:16px;border-radius:8px;width:100%;line-height:1.8}code{color:#2563eb}
</style></head><body><div class="i">⚠</div><h1>${title}</h1><div class="d">${details}</div>
<div class="h"><strong>Проверьте:</strong><br>• PostgreSQL запущен<br>• <code>.env</code> → <code>DATABASE_URL</code><br>• Порт ${PORT} свободен<br>• <code>npm install</code><br>• <code>npx prisma db push</code></div></body></html>`)}`);
}

// ─── Server ─────────────────────────────────────────

function isPortInUse() {
  return new Promise(r => {
    const req = http.get(APP_URL, res => { res.resume(); r(true); });
    req.on("error", () => r(false)); req.setTimeout(1000, () => { req.destroy(); r(false); });
  });
}

function startServer() {
  const cmd = process.platform === "win32" ? "npm.cmd" : "npm";
  serverProcess = spawn(cmd, ["run", IS_DEV ? "dev" : "start"], {
    cwd: APP_DIR, stdio: "pipe", env: { ...process.env, PORT: String(PORT) }, shell: true, windowsHide: true,
  });
  serverProcess.stdout?.on("data", d => { const m = d.toString().trim(); if (m) console.log(`[SRV] ${m}`); });
  serverProcess.stderr?.on("data", d => { const m = d.toString().trim(); if (m && !m.includes("Experimental") && !m.includes("punycode")) console.error(`[SRV] ${m}`); });
  serverProcess.on("exit", c => { if (!isQuitting && c !== 0) showError("Сервер остановился", `Код: ${c}`); });
}

function stopServer() {
  if (!serverProcess) return; isQuitting = true;
  if (process.platform === "win32") { try { execSync(`taskkill /pid ${serverProcess.pid} /f /t`, { stdio: "ignore" }); } catch {} }
  else { serverProcess.kill("SIGTERM"); setTimeout(() => { try { serverProcess?.kill("SIGKILL"); } catch {} }, 5000); }
  serverProcess = null;
}

function killOrphanedProcesses() {
  if (process.platform !== "win32") return;
  try {
    const out = execSync(`netstat -ano | findstr :${PORT} | findstr LISTENING`, { encoding: "utf-8" });
    for (const l of out.trim().split("\n")) { const p = l.trim().split(/\s+/).pop(); if (p && p !== String(process.pid)) execSync(`taskkill /pid ${p} /f`, { stdio: "ignore" }); }
  } catch {}
}

function waitForServer(retries = 45) {
  return new Promise((ok, fail) => {
    let a = 0;
    const check = () => {
      a++; updateSplash(`Ожидание сервера... (${a}/${retries})`);
      const r = http.get(APP_URL, res => { res.resume(); ok(); });
      r.on("error", () => { if (a >= retries) fail(); else setTimeout(check, 1000); });
      r.setTimeout(2000, () => { r.destroy(); if (a < retries) setTimeout(check, 1000); else fail(); });
    };
    check();
  });
}

// ─── Main Window ────────────────────────────────────

function createWindow() {
  const st = loadWindowState();
  mainWindow = new BrowserWindow({
    width: st.width || 1280, height: st.height || 860, x: st.x, y: st.y,
    minWidth: 800, minHeight: 600, title: "Smart Life Assistant",
    icon: getIconPath("icon-256"),
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    show: false, backgroundColor: "#ffffff",
  });
  mainWindow.loadURL(`${APP_URL}${lastRoute}`);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.once("ready-to-show", () => { closeSplash(); if (!desktopSettings.startMinimized) { mainWindow.show(); mainWindow.focus(); } });
  mainWindow.on("resize", saveWindowState);
  mainWindow.on("move", saveWindowState);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http") && !url.startsWith(APP_URL)) { shell.openExternal(url); return { action: "deny" }; }
    return { action: "allow" };
  });
  mainWindow.on("close", e => { if (!isQuitting && desktopSettings.closeToTray) { e.preventDefault(); saveWindowState(); mainWindow.hide(); } });
}

// ─── Tray ───────────────────────────────────────────

function getIconPath(name) {
  for (const ext of ["ico", "png", "svg"]) {
    const p = path.join(APP_DIR, "public", "icons", `${name}.${ext}`);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function createTray() {
  const ip = getIconPath("icon-192") || getIconPath("icon-256");
  let icon; try { icon = ip ? nativeImage.createFromPath(ip) : nativeImage.createEmpty(); if (icon.isEmpty()) icon = nativeImage.createEmpty(); } catch { icon = nativeImage.createEmpty(); }
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip("Smart Life Assistant");
  tray.on("double-click", () => { mainWindow?.show(); mainWindow?.focus(); });
  updateTrayMenu();
}

// ─── Pre-flight ─────────────────────────────────────

function checkPrereqs() {
  if (!fs.existsSync(path.join(APP_DIR, ".env"))) { showError("Файл .env не найден", "Создайте .env на основе .env.example"); return false; }
  if (!fs.existsSync(path.join(APP_DIR, "node_modules"))) { showError("Зависимости не установлены", "Выполните npm install"); return false; }
  if (!IS_DEV && !fs.existsSync(path.join(APP_DIR, ".next"))) { showError("Не собрано", "Выполните npm run build"); return false; }
  return true;
}

// ─── Lifecycle ──────────────────────────────────────

function isFirstRun() { return !fs.existsSync(FIRST_RUN_FILE); }
function markFirstRunDone() { try { fs.writeFileSync(FIRST_RUN_FILE, new Date().toISOString()); } catch {} }

// Retry from error screen
ipcMain.on("retry-start", () => { log.info("APP", "Retry requested"); app.relaunch(); app.quit(); });
ipcMain.on("open-logs", () => { const dir = log.getLogDir(); if (dir) shell.openPath(dir); });

app.whenReady().then(async () => {
  createSplash();
  updateSplash("Проверка...");
  if (!checkPrereqs()) return;

  // First run desktop onboarding
  if (isFirstRun()) {
    closeSplash();
    log.info("APP", "First run — showing onboarding");
    const settings = await showFirstRun(desktopSettings);
    if (settings) { desktopSettings = { ...desktopSettings, ...settings }; saveDesktopSettings(); }
    markFirstRunDone();
    createSplash();
  }

  // Server startup
  if (await isPortInUse()) {
    updateSplash("Подключение...");
    log.info("SERVER", "Already running");
  } else {
    killOrphanedProcesses();
    updateSplash("Запуск сервера...");
    startServer();
    try { await waitForServer(45); } catch { showError("Сервер не запустился", "Проверьте базу данных и конфигурацию."); return; }
  }

  updateSplash("Открытие...");
  createWindow();
  createTray();
  await setupAutoLaunch();
  startReminderChecks();

  // Initial notification check
  setTimeout(async () => {
    try {
      const d = await fetchJSON(`${APP_URL}/api/notifications/count`);
      if (d?.count > 0) showNativeNotification("Smart Life Assistant", `У вас ${d.count} непрочитанных уведомлений`, "/notifications");
    } catch {}
  }, 5000);

  log.info("APP", "Ready");
});

app.on("before-quit", () => { isQuitting = true; saveWindowState(); stopReminderChecks(); stopServer(); log.info("APP", "Quit"); log.close(); });
app.on("window-all-closed", () => {});
app.on("activate", () => { mainWindow?.show(); });
