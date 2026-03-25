@echo off
title Smart Life Assistant
cd /d "%~dp0"

echo.
echo  Smart Life Assistant
echo  ====================
echo.

:: Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js не найден. Установите с https://nodejs.org
    pause
    exit /b 1
)

:: Check dependencies
if not exist node_modules (
    echo [SETUP] Установка зависимостей...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install не удался
        pause
        exit /b 1
    )
    echo.
)

:: Check Prisma client
if not exist node_modules\.prisma (
    echo [SETUP] Генерация Prisma client...
    call npx prisma generate
)

:: Build if needed (production mode)
if not exist .next (
    echo [BUILD] Сборка приложения...
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Сборка не удалась
        pause
        exit /b 1
    )
    echo.
)

:: Check if port 3000 is already in use
netstat -ano | findstr :3000 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    echo [INFO] Сервер уже запущен на порту 3000
    echo [INFO] Открываю браузер...
    start http://localhost:3000
    exit /b 0
)

echo [START] Запуск сервера (production)...
start /min cmd /c "title SLA Server && npm run start"

echo [WAIT] Ожидание сервера...
:wait_loop
timeout /t 1 >nul
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 goto wait_loop

echo [READY] Открываю Smart Life Assistant...
start http://localhost:3000

echo.
echo  Приложение работает на http://localhost:3000
echo  Для остановки: закройте окно "SLA Server"
echo.
