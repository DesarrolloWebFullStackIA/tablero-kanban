@echo off
title Tablero Kanban - Launcher
chcp 65001 >nul
cls
echo ===============================================================
echo            TABLERO KANBAN - INICIALIZADOR DE PROYECTO          
echo ===============================================================
echo.
echo [1/3] Iniciando Backend REST API (json-server en puerto 3000)...
start "Tablero Kanban - Backend (json-server :3000)" cmd /c "npx json-server ./data/data.json --port 3000"

echo [2/3] Iniciando Servidor Frontend Local (puerto 5000)...
start "Tablero Kanban - Frontend (serve :5000)" cmd /c "npx serve . -l 5000 -s"

echo [3/3] Esperando inicializacion de servicios...
timeout /t 2 /nobreak >nul

echo.
echo Abriendo aplicacion en el navegador predeterminado...
start http://localhost:5000

echo.
echo ===============================================================
echo   ¡TODO LISTO! La aplicacion se encuentra en ejecucion:
echo   - Frontend: http://localhost:5000
echo   - Backend:  http://localhost:3000 (API REST: /tasks, /comments)
echo.
echo   Para detener los servicios, simplemente cierra las ventanas
echo   de consola del Backend y Frontend.
echo ===============================================================
echo.
pause