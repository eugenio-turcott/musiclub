@echo off
echo ========================================================
echo   Configurando Tarea Programada de Ingesta Automatica Musiclub (Cada 30 Minutos)
echo ========================================================
echo.

set TASK_NAME=Musiclub_30Min_Ingest
set WORKDIR=%~dp0..
set SCRIPT_PATH=%WORKDIR%\scripts\hourlyMusicBrainzIngestion.mjs

echo Directorio de trabajo: %WORKDIR%
echo Script: %SCRIPT_PATH%
echo.

:: Crear tarea programada en Windows que corre cada 30 minutos
schtasks /create /tn "%TASK_NAME%" /tr "node \"%SCRIPT_PATH%\" 50" /sc minute /mo 30 /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo [EXITO] Tarea programada '%TASK_NAME%' registrada correctamente.
    echo Se ejecutara automaticamente cada 30 minutos en segundo plano (50 albumes por ciclo).
    echo Para iniciarla ahora mismo manualmente:
    echo   schtasks /run /tn "%TASK_NAME%"
    echo Para eliminarla si ya no la deseas:
    echo   schtasks /delete /tn "%TASK_NAME%" /f
    echo ========================================================
) else (
    echo.
    echo [AVISO] Si recibiste error de acceso denegado, por favor ejecuta este archivo .bat como Administrador.
)

pause
