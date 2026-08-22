@echo off
title ProxyTunnel Windows 11 Build & Package Script
color 0A

echo ===============================================================================
echo                ProxyTunnel VPN Client - Windows 11 Build Tool
echo ===============================================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

:: 2. Check Rust / Cargo
where cargo >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Rust/Cargo not detected in PATH.
    echo If you want to compile with Tauri, please install Rust from https://rustup.rs/
    echo Proceeding to compile standard web bundle and Inno Setup package...
    goto BUILD_WEB
)

echo [1/3] Installing NPM project dependencies...
call npm install

echo [2/3] Compiling React and Tailwind Frontend...
call npm run build

if not exist "src-tauri\icons\icon.ico" (
    echo [INFO] Generating Windows App Icons...
    node scripts\generate-icons.cjs
)

echo [3/3] Building Tauri Native Windows Executable (.exe / .msi)...
call npx @tauri-apps/cli@1 build

if %errorlevel% equ 0 (
    echo.
    echo ===============================================================================
    echo [SUCCESS] Windows Installer created successfully!
    echo Location: src-tauri\target\release\bundle\nsis\ProxyTunnel_1.1.0_x64-setup.exe
    echo ===============================================================================
    goto FINISH
)

:BUILD_WEB
echo.
echo [INFO] Generating Portable Distribution Folder...
call npm run build

:: Check Inno Setup
if exist "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" (
    echo [INFO] Compiling installer with Inno Setup Compiler...
    "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer.iss
    echo [SUCCESS] Installer compiled at: .\Output\ProxyTunnel-Windows11-Setup.exe
) else (
    echo [NOTE] Inno Setup compiler not found at default path.
    echo You can install Inno Setup 6 (https://jrsoftware.org/isdl.php) and compile 'installer.iss' with 1-click.
)

:FINISH
echo.
pause
