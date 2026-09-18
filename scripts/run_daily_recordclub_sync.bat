@echo off
cd /d "%~dp0.."
"C:\Program Files\nodejs\node.exe" "%~dp0dailyRecordClubSync.mjs" >> "%~dp0sync_daily.log" 2>&1
