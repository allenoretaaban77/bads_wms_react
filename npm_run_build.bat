@echo off
title Building BADS WMS...
echo Navigating to project folder...

:: Move to the project directory
cd /d "C:\Projects\Ronald\wms\app\bads-wms"

echo Running npm run build...
echo ------------------------------------------

:: Run the build command
call npm run build

echo ------------------------------------------
echo Build process finished!
pause