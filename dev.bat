@echo off
chcp 65001 >nul
powershell -ExecutionPolicy Bypass -NoExit -File "%~dp0dev.ps1"
