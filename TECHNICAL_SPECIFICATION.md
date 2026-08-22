# Technical Specification (ТЗ): Windows 11 Proxy-to-VPN Tunnel Client

**Document Version:** 1.1  
**Target OS:** Windows 11 (x64 / ARM64) & Windows 10 (21H2+)  
**Distribution Format:** Single-file installer (`.exe` via Inno Setup / NSIS)

---

## 1. Project Overview & Objective

The application is a lightweight, modern, and intuitive Windows desktop VPN/Proxy client. It routes system-wide outbound network traffic through user-configured custom proxy servers (**SOCKS5** and **HTTP/HTTPS**) using a high-performance virtual TUN network adapter (**Wintun**). 

The app features granular **Split-Tunneling (App Bypass)** to exempt specific applications (e.g., Google Chrome, games, local utilities) from proxying, dual-language localization (**English / Русский**), and a comprehensive built-in **Help & Troubleshooting Guide**.

---

## 2. System Architecture & Core Stack

```
+------------------------------------------------------------------+
|               User Interface Layer (Desktop GUI)                |
|  - React 19 + TypeScript + Tailwind CSS + Lucide Icons           |
|  - Multi-language (EN / RU) + Responsive Minimalist UI           |
|  - System Tray Controls & Desktop Notifications                  |
+---------------------------------+--------------------------------+
                                  | IPC (Inter-Process Bridge)
+---------------------------------v--------------------------------+
|                 Core Routing Engine (Backend Service)            |
|  - Routing Supervisor & Process Filter Engine                    |
|  - Protocol Engine: SOCKS5 (with Auth & UDP) / HTTP CONNECT      |
|  - Wintun Virtual TUN Adapter Driver (Layer 3 Packet Routing)     |
|  - Windows Filtering Platform (WFP) App Exclusion Hook           |
|  - DNS-over-HTTPS (DoH) / DNS Leak Shield                        |
+---------------------------------+--------------------------------+
                                  | Win32 Network Stack
+---------------------------------v--------------------------------+
|                   Windows 11 Operating System                    |
|  - Default Routes (0.0.0.0/0 -> Wintun Adapter)                  |
|  - App Exclusions (Bypass List -> Physical Gateway Interface)   |
+------------------------------------------------------------------+
```

### Core Technologies
1. **Frontend / UI Shell**: Tauri (Rust + Web) or Electron / Desktop Wrapper with hardware-accelerated fluid UI.
2. **Virtual Network Interface**: `wintun.dll` (official high-performance WireGuard TUN driver for Windows).
3. **Core Engine**: Sing-box / Tun2proxy routing layer handling TCP/UDP packet conversion to SOCKS5/HTTP requests.
4. **Installer**: Inno Setup / NSIS standalone installer with automated Wintun driver deployment and UAC background service helper.

---

## 3. Detailed Functional Requirements

### 3.1. Proxy Management Module
- **Supported Protocols**:
  - **SOCKS5**: TCP & UDP Associate with username/password authentication (RFC 1928, RFC 1929).
  - **HTTP / HTTPS CONNECT**: Full HTTP Proxy support with basic authentication.
- **Proxy Profile Attributes**:
  - `Tag / Name` (e.g., "Frankfurt Server 01", "Work Proxy")
  - `Protocol` (`SOCKS5` | `HTTP`)
  - `Host / IP` (Domain name or IPv4/IPv6 address)
  - `Port` (1 – 65535)
  - `Username / Login` (optional)
  - `Password` (optional, masked with toggleable view)
- **Profile Actions**: Add, Edit, Delete, Test Latency (Ping/RTT measurement in ms), Quick Active Server Selector.
- **Import / Export**: JSON configuration format and standard proxy string format (`protocol://user:pass@host:port`).

### 3.2. System-Wide TUN Tunneling Engine
- **One-Click Connect / Disconnect**: Instant activation with smooth state transitions.
- **Dynamic Route Management**: Seamlessly intercepts default gateway routes without dropping local LAN access (e.g., router 192.168.x.x, printers, local subnets).
- **Graceful Fail-safe**: Automatically restores original network routing table if the app is abruptly closed or terminated.
- **Real-time Diagnostics**:
  - Upload & Download bitrate graphs.
  - Active outbound public IP address and country/flag detection.
  - Connection duration timer.

### 3.3. App Bypass / Split-Tunneling Engine
- **Routing Modes**:
  - **Bypass Mode (Blacklist - Default)**: All system traffic goes through the proxy *except* listed apps.
  - **Proxy-Only Mode (Whitelist)**: Only listed apps use the proxy; all other system traffic stays direct.
- **Application Selection Methods**:
  - **Live Process Picker**: One-click add from currently running desktop processes (with process name and app icon).
  - **File Explorer Browser**: Custom `.exe` file selection dialog.
  - **Manual Path / Process Name Entry** (e.g., `chrome.exe`, `C:\Program Files\Google\Chrome\Application\chrome.exe`).
- **Individual Toggle**: Enable or disable specific rules without deleting them.

### 3.4. Multi-Language System (i18n)
- Seamless real-time language switcher in Settings:
  - **English (EN)**
  - **Русский (RU)**
- Complete localization across all modals, tooltips, status indicators, and documentation.

### 3.5. Built-in Help & User Documentation
- Dedicated in-app **Help & Knowledge Base** section:
  1. **Quick Start Guide**: How to add your first SOCKS5 or HTTP proxy and connect.
  2. **Understanding Protocols**: Differences between SOCKS5 (full TCP/UDP support) and HTTP.
  3. **Configuring App Exclusions (Split Tunneling)**: Step-by-step tutorial on excluding Chrome, games, and banking apps.
  4. **Troubleshooting & FAQs**: Solving DNS leaks, resolving authorization errors, and Windows firewall allowances.
  5. **Network Diagnostics**: Built-in test tool (Check Proxy Reachability, Test DNS, Test Direct vs Proxied IP).

### 3.6. Security & Stability Guardrails
- **DNS Leak Protection**: All DNS queries are routed into the tunnel via encrypted DNS-over-HTTPS (Cloudflare / Google / Quad9) to prevent ISP inspection.
- **IPv6 Leak Prevention**: Automatically blackholes IPv6 leaks if the upstream proxy is IPv4-only.
- **Kill Switch (Optional Toggle)**: Prevents accidental unencrypted data transmission if the proxy connection unexpectedly drops.
- **Auto-Start & Tray**: Run at Windows startup, minimize to system tray on close, quick connect/disconnect from tray menu.

---

## 4. UI/UX Design System & Layout

- **Aesthetic Direction**: Sophisticated, clean, high-contrast dark/light modern Windows 11 Fluent-inspired theme.
- **Layout Architecture**:
  - **Sidebar / Navigation**: 
    - ⚡ **Dashboard / Connect**: Prominent toggle button, active proxy badge, traffic speed chart, latency & public IP status.
    - 🌐 **Proxies**: Server manager card list, ping test, add/edit modal.
    - 🛡️ **Split Tunneling (Apps)**: App exclusion list with process icons, search bar, and add-program sheet.
    - 📖 **Help & Guide**: Structured interactive manual with searchable topics and diagnostics.
    - ⚙️ **Settings**: Language selector (EN / RU), TUN driver settings, Kill Switch, Auto-start, DNS provider selector.

---

## 5. Potential Technical Risks & Solutions

| # | Risk / Challenge | Technical Impact | Solution & Mitigation |
|---|---|---|---|
| **1** | **Windows UAC (Administrator Rights)** | Creating a TUN adapter and modifying routing tables requires Elevated Administrator privileges. | The installer registers a lightweight background Service Helper running under `NT AUTHORITY\SYSTEM`. The GUI runs as standard user and communicates via secure local IPC. |
| **2** | **UDP Traffic on HTTP Proxies** | HTTP/HTTPS CONNECT proxies do not natively support raw UDP (voice calls, DNS, certain games). | Provide clear UI indicator when an HTTP proxy is chosen; automatically encapsulate DNS in TCP (DNS-over-HTTPS) and warn user if UDP-reliant apps are detected. Recommend SOCKS5 for complete system encapsulation. |
| **3** | **Windows SmartScreen Filter** | Unsigned or newly built binaries may trigger a Windows Defender SmartScreen warning on first launch. | Document standard installation instructions ("More info" -> "Run anyway") and provide checksum hashes (SHA-256) with release artifacts. |
| **4** | **Antivirus Interference** | Some 3rd-party antiviruses flag dynamic virtual adapter creation. | Use the officially signed `Wintun.dll` driver from WireGuard LLC, which has high reputation across major AV vendor databases. |

---

## 6. Deliverables & Build Packaging

1. **Standalone Installer**: `ProxyTunnel-Setup-x64.exe` (Single file containing GUI, Core Engine, Wintun driver, and Service Helper).
2. **Portable Edition**: `ProxyTunnel-Portable.zip` (For zero-install running with manual administrator launch).
3. **Interactive Web / Simulator Demo**: A fully functional interactive dashboard and management console with real-time state emulation, multi-language switching, proxy latency testing, app exclusion manager, and integrated help guide.

---

## 7. Approval & Next Steps

Upon your approval of this technical specification, the full application codebase and interactive system will be implemented according to these specifications.
