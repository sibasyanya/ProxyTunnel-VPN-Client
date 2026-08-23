# 🛡️ ProxyTunnel VPN Client (v1.2.0)

A modern, high-performance SOCKS5 & HTTP/HTTPS system tunneling client for **Windows 11 / 10**, built with **Tauri (Rust)**, **React**, **TypeScript**, and **Tailwind CSS**.

![Platform: Windows 11](https://img.shields.io/badge/Platform-Windows%2011%20%7C%2010-0078D4?logo=windows)
![Rust Tauri v1.6](https://img.shields.io/badge/Backend-Rust%20Tauri%201.6-DEA584?logo=rust)
![React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

---

## ✨ Features

- ⚡ **Seamless System-Wide Tunneling**: Applies system proxy settings across WinINet, Registry, WinHTTP, and Windows 11 services. Fully supports Telegram Desktop, Edge, Chrome, and background apps.
- 🎨 **Dark / Light Mode**: Instant one-click toggle in the header and settings.
- 🔀 **Split Tunneling (App Bypass)**:
  - **Blacklist Mode**: Route all traffic through proxy except selected applications (e.g. games).
  - **Whitelist Mode**: Tunnel only specified applications.
  - **Live Process Scanner**: Scan running Windows tasks and add them in one click.
  - **Native File Dialog**: Browse and select any `.exe` binary on your drive.
- 🔒 **DNS Leak Protection & Kill Switch**: Prevents ISP snooping and blocks traffic on connection drop.
- 📊 **Real-time Telemetry**: Live incoming/outgoing speed, ping, session duration, and outbound IP with one-click verification on 2ip.io.
- 📥 **System Tray Support**: Minimizes cleanly to the notification area next to the clock.

---

## 🛠️ Tech Stack & Architecture

- **Backend**: Rust (`tauri`, `winapi`, PowerShell automation)
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Packaging**: Windows MSI & NSIS installer via `@tauri-apps/cli`

---

## 🚀 Building from Source

### Prerequisites
1. **Node.js** (v18+)
2. **Rust & Cargo** (`rustup default stable-x86_64-pc-windows-msvc`)
3. **Visual Studio C++ Build Tools**

### Build Commands

```bash
# 1. Install dependencies
npm install

# 2. Build production Windows release
npx @tauri-apps/cli@1 build
```

The compiled installer will be located in:
`src-tauri/target/release/bundle/msi/ProxyTunnel_1.2.0_x64_en-US.msi`
`src-tauri/target/release/bundle/nsis/ProxyTunnel_1.2.0_x64-setup.exe`

---

## 📄 License
Distributed under the MIT License.
