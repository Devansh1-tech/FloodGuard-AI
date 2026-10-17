@echo off
REM =============================================================================
REM FloodGuard AI — Local Development Server Launcher (Windows)
REM =============================================================================

echo Starting FloodGuard AI Development Server...
set PYTHONPATH=%~dp0..;%PYTHONPATH%
cd %~dp0..
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
