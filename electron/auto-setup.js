/**
 * Auto-setup module for desktop app.
 * Creates DB, .env, runs migrations, creates default user.
 * Zero manual steps required from the user.
 */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

function autoSetup({ appDir, userDataDir, updateStatus, log }) {
  const dbPath = path.join(userDataDir, "smart-life.db").replace(/\\/g, "/");
  const dbUrl = `file:${dbPath}`;
  const envPath = path.join(appDir, ".env");

  // Step 1: Create .env if missing or update DATABASE_URL
  updateStatus("Настройка конфигурации...");
  log("SETUP", "Checking .env", { envPath });

  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }

  // Always ensure correct DATABASE_URL for SQLite
  const envLines = envContent.split("\n").filter(l => !l.startsWith("DATABASE_URL=") && !l.startsWith("DESKTOP_MODE=") && !l.startsWith("AUTH_SECRET=") && !l.startsWith("NEXTAUTH_URL="));

  envLines.push(`DATABASE_URL="${dbUrl}"`);
  envLines.push(`DESKTOP_MODE=true`);
  envLines.push(`NEXTAUTH_URL=http://localhost:3000`);

  // Generate AUTH_SECRET if not present
  if (!envContent.includes("AUTH_SECRET=")) {
    envLines.push(`AUTH_SECRET="${crypto.randomBytes(32).toString("hex")}"`);
  }

  fs.writeFileSync(envPath, envLines.filter(Boolean).join("\n") + "\n");
  log("SETUP", "Env written", { dbUrl });

  // Step 2: Run prisma db push (creates tables if needed)
  updateStatus("Подготовка базы данных...");
  log("SETUP", "Running prisma db push");

  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

  try {
    execSync(`npx prisma db push --skip-generate --accept-data-loss`, {
      cwd: appDir,
      env: { ...process.env, DATABASE_URL: dbUrl },
      stdio: "pipe",
      timeout: 30000,
      windowsHide: true,
    });
    log("SETUP", "Prisma db push OK");
  } catch (err) {
    log("SETUP", "Prisma db push failed, trying alternative", { error: err.message });
    // Try with npx directly
    try {
      execSync(`npx prisma db push --skip-generate --accept-data-loss`, {
        cwd: appDir,
        env: { ...process.env, DATABASE_URL: dbUrl },
        stdio: "pipe",
        timeout: 30000,
        shell: true,
        windowsHide: true,
      });
      log("SETUP", "Prisma db push OK (shell mode)");
    } catch (err2) {
      log("SETUP", "Prisma db push failed completely", { error: err2.message });
      throw new Error("Database setup failed: " + err2.message);
    }
  }

  // Step 3: Create default user if DB is empty
  updateStatus("Создание пользователя...");
  createDefaultUser(appDir, dbUrl, log);

  log("SETUP", "Auto-setup complete");
  return { dbUrl, dbPath };
}

function createDefaultUser(appDir, dbUrl, log) {
  // Use prisma client to create user via a small inline script
  const script = `
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient({ datasources: { db: { url: '${dbUrl}' } } });
    (async () => {
      try {
        const count = await p.user.count();
        if (count === 0) {
          await p.user.create({
            data: {
              id: 'local-user',
              email: 'user@smartlife.local',
              name: 'Пользователь',
            }
          });
          console.log('USER_CREATED');
        } else {
          console.log('USER_EXISTS');
        }
      } catch(e) { console.error('ERR:' + e.message); }
      finally { await p.$disconnect(); }
    })();
  `;

  try {
    const result = execSync(`node -e "${script.replace(/"/g, '\\"').replace(/\n/g, " ")}"`, {
      cwd: appDir,
      env: { ...process.env, DATABASE_URL: dbUrl },
      encoding: "utf-8",
      timeout: 15000,
      windowsHide: true,
      shell: true,
    });
    log("SETUP", "User creation result", { result: result.trim() });
  } catch (err) {
    log("SETUP", "User creation warning", { error: err.message });
    // Non-fatal — user might already exist
  }
}

function needsSetup(userDataDir) {
  const dbPath = path.join(userDataDir, "smart-life.db");
  return !fs.existsSync(dbPath);
}

module.exports = { autoSetup, needsSetup };
