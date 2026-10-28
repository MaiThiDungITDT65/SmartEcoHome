@echo off
setlocal

REM Smart Eco Home - Run Backend and Frontend from this project's folder.
REM Place this .bat file in Smart-Eco-Garden-main (or its backup copy).

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

if not exist "%BACKEND%\app\main.py" (
  echo [ERROR] Backend not found: "%BACKEND%\app\main.py"
  echo Move this file into the Smart-Eco-Garden project root folder.
  pause
  exit /b 1
)
if not exist "%BACKEND%\.venv\Scripts\python.exe" (
  echo [ERROR] Backend Python environment not found.
  echo Expected: "%BACKEND%\.venv\Scripts\python.exe"
  echo Run the backend dependency installation first.
  pause
  exit /b 1
)
if not exist "%FRONTEND%\package.json" (
  echo [ERROR] Frontend not found: "%FRONTEND%\package.json"
  pause
  exit /b 1
)
if not exist "%FRONTEND%\node_modules" (
  echo [ERROR] Frontend dependencies not installed.
  echo Open the frontend directory and run: npm install
  pause
  exit /b 1
)

echo Starting Smart Eco Home servers...
echo Project: %ROOT%
start "Smart Eco Home - Backend" /D "%BACKEND%" cmd /k ".venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
start "Smart Eco Home - Frontend" /D "%FRONTEND%" cmd /k "npm run dev"
echo.
echo Opening Dashboard in browser...
timeout /t 8 /nobreak >nul
start "" "http://localhost:3000"
echo.
echo Done. Leave the Backend and Frontend command windows open.
echo To stop: press Ctrl+C in each server window, then close them.
exit /b 0
