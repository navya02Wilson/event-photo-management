@echo off
REM Start script for Python Face Recognition Service (Windows)

REM Set default port if not set
if "%PYTHON_SERVICE_PORT%"=="" set PYTHON_SERVICE_PORT=8000
if "%PYTHON_SERVICE_HOST%"=="" set PYTHON_SERVICE_HOST=127.0.0.1

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
)

REM Run the service
python main.py










