@echo off
echo ========================================================
echo   Configurando Tarea Programada de Sincronizacion Diaria (Musiclub V.9.0)
echo ========================================================
echo.

set TASK_NAME=Musiclub_Daily_Sync
set RUNNER_PATH=%~dp0run_daily_recordclub_sync.bat

echo Runner batch: %RUNNER_PATH%
echo Hora programada: 08:00 AM todos los dias
echo.

:: Crear o actualizar la tarea programada en Windows que corre 1 vez al dia a las 08:00 AM
schtasks /create /tn "%TASK_NAME%" /tr "%RUNNER_PATH%" /sc daily /st 08:00 /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo [EXITO] Tarea programada '%TASK_NAME%' registrada correctamente.
    echo Se ejecutara automaticamente cada dia a las 08:00 AM en segundo plano.
    echo Realiza consultas paralelas a las APIs, actualiza tendencias, proximos estrenos,
    echo estadisticas globales y agrega lanzamientos enriquecidos al catalogo general.
    echo.
    echo Para ejecutarla manualmente ahora mismo:
    echo   schtasks /run /tn "%TASK_NAME%"
    echo Para verificar su estado:
    echo   schtasks /query /tn "%TASK_NAME%" /fo LIST
    echo Para ver el log de ejecucion:
    echo   type "%~dp0sync_daily.log"
    echo Para eliminarla si ya no la deseas:
    echo   schtasks /delete /tn "%TASK_NAME%" /f
    echo ========================================================
) else (
    echo.
    echo [AVISO] Si recibiste error de acceso denegado, por favor ejecuta este archivo .bat como Administrador.
)

pause
