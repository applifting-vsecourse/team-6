@echo off
rem Runs the Selenium suite, or only the tests you name. The Windows twin of run.sh.
rem
rem   tests_selenium\run.bat [test name ...] [pytest options ...]
rem
rem   pnpm test:selenium                          everything (web)
rem   pnpm test:selenium mascot video             tests whose name contains "mascot" or "video"
rem   pnpm test:selenium test_10_landing_page.py  one file
rem   pnpm test:selenium chat -x                  options after the names go to pytest
rem
rem A name is any part of a test's name, class or file. A path (with / \ or ::, or ending in .py)
rem is run as given. Everything from the first option starting with "-" goes to pytest unchanged.
rem The iOS Safari tests (--ios) need macOS with Xcode, so they cannot run on Windows.
setlocal EnableExtensions DisableDelayedExpansion
cd /d "%~dp0.."

set "PYTEST=.venv\Scripts\pytest.exe"
if not exist "%PYTEST%" (
  echo No test environment yet. Run: pnpm test:selenium:setup
  exit /b 1
)

if /i "%~1"=="--ios" (
  echo The iOS Safari tests need macOS with Xcode and the iOS Simulator; they cannot run on Windows.
  exit /b 1
)

set "EXPR="
set "PATHS="
set "REST="

:names
if "%~1"=="" goto exec
set "ARG=%~1"
if "%ARG:~0,1%"=="-" goto rest
echo(%ARG%| findstr /r /c:"[/\\]" /c:"::" /c:"\.py$" >nul
if errorlevel 1 (call :add_name) else (call :add_path)
shift
goto names

:rest
if "%~1"=="" goto exec
set REST=%REST% %1
shift
goto rest

:exec
if not defined PATHS set "PATHS=tests_selenium"
if defined EXPR (
  "%PYTEST%" %PATHS% -k "%EXPR%" %REST%
) else (
  "%PYTEST%" %PATHS% %REST%
)
exit /b %ERRORLEVEL%

:add_name
if defined EXPR (set "EXPR=%EXPR% or %ARG%") else (set "EXPR=%ARG%")
exit /b 0

:add_path
rem The file part is everything before the first ":" (a test id is file::Class::test).
set "FILE=%ARG%"
for /f "delims=:" %%p in ("%ARG%") do set "FILE=%%p"
if exist "%FILE%" (set "PATHS=%PATHS% "%ARG%"") else (set "PATHS=%PATHS% "tests_selenium\tests\%ARG%"")
exit /b 0
