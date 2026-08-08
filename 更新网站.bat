@echo off
rem ============================================================
rem  三省轩主文集 - 更新工具
rem  双击此文件，会用浏览器打开更新页面。
rem  然后在页面中点"选择文件夹"选中本文件夹，再点"开始更新"。
rem ============================================================
set "TOOL=%~dp0build.html"

start "" msedge "%TOOL%" 2>nul
if not errorlevel 1 exit /b 0

start "" "microsoft-edge:file:///%TOOL:\=/%" 2>nul
if not errorlevel 1 exit /b 0

rem Fallback: open with the default browser
start "" "%TOOL%"
