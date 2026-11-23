@echo off
rem Creates .venv and installs the test requirements. The Windows twin of setup.sh.
setlocal EnableExtensions
cd /d "%~dp0.."

where py >nul 2>nul
if not errorlevel 1 (py -3 -m venv .venv) else (python -m venv .venv)
if errorlevel 1 (
  echo Could not create .venv. Install Python 3 from https://www.python.org and try again.
  exit /b 1
)
.venv\Scripts\python.exe -m pip install -r tests_selenium\requirements.txt
exit /b %ERRORLEVEL%
