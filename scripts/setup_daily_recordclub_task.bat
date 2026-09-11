@echo off
echo ========================================================
echo   Configurando Tarea Programada de Sincronizacion Diaria Record Club (Musiclub)
echo ========================================================
echo.

set TASK_NAME=Musiclub_Daily_RecordClub_Sync
set WORKDIR=%~dp0..
set SCRIPT_PATH=%WORKDIR%\scripts\dailyRecordClubSync.mjs

echo Directorio de trabajo: %WORKDIR%
echo Script: %SCRIPT_PATH%
echo Hora programada: 04:00 AM todos los dias
echo.

:: Crear tarea programada en Windows que corre 1 vez al dia a las 04:00 AM
schtasks /create /tn "%TASK_NAME%" /tr "node \"%SCRIPT_PATH%\"" /sc daily /st 04:00 /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo [EXITO] Tarea programada '%TASK_NAME%' registrada correctamente.
    echo Se ejecutara automaticamente cada dia a las 04:00 AM en segundo plano.
    echo Realiza 1 sola consulta diaria por endpoint y guarda todo en Supabase.
    echo.
    echo Para ejecutarla ahora mismo manualmente:
    echo   schtasks /run /tn "%TASK_NAME%"
    echo Para eliminarla si ya no la deseas:
    echo   schtasks /delete /tn "%TASK_NAME%" /f
    echo ========================================================
) else (
    echo.
    echo [AVISO] Si recibiste error de acceso denegado, por favor ejecuta este archivo .bat como Administrador.
)

pause
