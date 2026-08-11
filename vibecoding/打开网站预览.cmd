@echo off
chcp 65001 >nul
cd /d "%~dp0"

set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "VITE_ENTRY=%~dp0node_modules\vite\bin\vite.js"

if not exist "%NODE_EXE%" (
  echo 未找到网页运行环境，请回到 Codex 里让我启动预览。
  pause
  exit /b 1
)

if not exist "%VITE_ENTRY%" (
  echo 依赖尚未安装，请回到 Codex 里让我安装后再预览。
  pause
  exit /b 1
)

start "" "http://127.0.0.1:4173"
echo 网页已打开。请保持这个窗口开启；关闭窗口后，本地网页也会停止。
echo.
"%NODE_EXE%" "%VITE_ENTRY%" --host 127.0.0.1 --port 4173

pause
