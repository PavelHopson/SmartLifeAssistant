// First-run desktop onboarding window
const { BrowserWindow, ipcMain } = require("electron");

let firstRunWindow = null;
let resolveFirstRun = null;

function showFirstRun(desktopSettings) {
  return new Promise((resolve) => {
    resolveFirstRun = resolve;

    firstRunWindow = new BrowserWindow({
      width: 480, height: 520, frame: false, resizable: false,
      center: true, backgroundColor: "#18181b",
      webPreferences: { nodeIntegration: true, contextIsolation: false },
    });

    const s = desktopSettings;
    const html = `data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#18181b;color:#fafafa;font-family:system-ui,-apple-system,sans-serif;padding:32px;display:flex;flex-direction:column;height:100vh}
.logo{width:64px;height:64px;border-radius:16px;background:#2563eb22;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#2563eb;margin:0 auto 16px}
h1{font-size:20px;font-weight:600;text-align:center;margin-bottom:6px}
.sub{font-size:13px;color:#a3a3a3;text-align:center;margin-bottom:24px}
.options{flex:1;overflow:auto}
.o{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid #262626}
.o:last-child{border:none}
.l{font-size:13px;font-weight:500}.d{font-size:11px;color:#737373;margin-top:2px}
.t{position:relative;width:40px;height:22px;cursor:pointer}
.t input{opacity:0;width:0;height:0}
.sl{position:absolute;inset:0;background:#333;border-radius:11px;transition:.2s}
.sl:before{content:"";position:absolute;height:16px;width:16px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s}
input:checked+.sl{background:#2563eb}input:checked+.sl:before{transform:translateX(18px)}
.btn{width:100%;padding:12px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-top:16px}
.primary{background:#2563eb;color:#fff}
.ghost{background:transparent;color:#a3a3a3;font-size:12px;margin-top:8px}
</style></head><body>
<div class="logo">SL</div>
<h1>Добро пожаловать!</h1>
<p class="sub">Настройте Smart Life Assistant под себя</p>
<div class="options">
  <div class="o"><div><div class="l">Запускать при входе в Windows</div><div class="d">Ассистент будет всегда рядом</div></div><label class="t"><input type="checkbox" id="a" checked><span class="sl"></span></label></div>
  <div class="o"><div><div class="l">Уведомления на рабочем столе</div><div class="d">Напоминания о задачах и действиях</div></div><label class="t"><input type="checkbox" id="b" checked><span class="sl"></span></label></div>
  <div class="o"><div><div class="l">Сворачивать в трей</div><div class="d">Приложение останется в фоне</div></div><label class="t"><input type="checkbox" id="c" checked><span class="sl"></span></label></div>
  <div class="o"><div><div class="l">Звук уведомлений</div></div><label class="t"><input type="checkbox" id="d" checked><span class="sl"></span></label></div>
</div>
<button class="btn primary" onclick="start()">Начать</button>
<button class="btn ghost" onclick="skip()">Настроить позже</button>
<script>
const{ipcRenderer}=require("electron");
function start(){ipcRenderer.send("first-run-done",{autoLaunch:a.checked,backgroundReminders:b.checked,closeToTray:c.checked,notificationSound:d.checked,startMinimized:false,showOverdueInTray:true})}
function skip(){ipcRenderer.send("first-run-done",null)}
</script></body></html>`)}`;

    firstRunWindow.loadURL(html);
    firstRunWindow.on("closed", () => {
      firstRunWindow = null;
      if (resolveFirstRun) { resolveFirstRun(null); resolveFirstRun = null; }
    });
  });
}

ipcMain.on("first-run-done", (_, settings) => {
  if (firstRunWindow && !firstRunWindow.isDestroyed()) firstRunWindow.close();
  firstRunWindow = null;
  if (resolveFirstRun) { resolveFirstRun(settings); resolveFirstRun = null; }
});

module.exports = { showFirstRun };
