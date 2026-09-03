@echo off
echo ========================================================
echo   Configurando Tarea Programada de Ingesta Horaria Musiclub
echo ========================================================
echo.

set TASK_NAME=Musiclub_Hourly_Ingest
set WORKDIR=%~dp0..
set SCRIPT_PATH=%WORKDIR%\scripts\hourlyMusicBrainzIngestion.mjs

echo Directorio de trabajo: %WORKDIR%
echo Script: %SCRIPT_PATH%
echo.

:: Crear tarea programada en Windows que corre cada 1 hora
schtasks /create /tn "%TASK_NAME%" /tr "node \"%SCRIPT_PATH%\"" /sc hourly /mo 1 /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo [EXITO] Tarea programada '%TASK_NAME%' registrada correctamente.
    echo Se ejecutara automaticamente cada 1 hora en segundo plano.
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
