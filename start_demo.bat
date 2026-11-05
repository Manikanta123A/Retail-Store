@echo off
REM One-click demo launcher: Flask API on :5000 + frontend on :3000
cd /d "%~dp0"
if not exist backend\.env (
  echo DATABASE_URL=sqlite:///retail_local.db> backend\.env
  echo SECRET_KEY=local-dev>> backend\.env
)
start "Retail API (5000)" cmd /k "cd /d %~dp0backend && python run_local.py"
start "Retail UI (3000)" cmd /k "cd /d %~dp0 && npx vite --port 3000 --host 0.0.0.0"
timeout /t 8 >nul
start http://localhost:3000
