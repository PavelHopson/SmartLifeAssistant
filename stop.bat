@echo off
echo Stopping Smart Life Assistant server...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo Server stopped.
timeout /t 2 >nul
