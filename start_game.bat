@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在啟動《武俠打字傳》本機伺服器 (http://127.0.0.1:8765)...
start "" "http://127.0.0.1:8765/index.html"
python -m http.server 8765 --bind 127.0.0.1
