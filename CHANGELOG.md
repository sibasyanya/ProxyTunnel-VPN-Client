# Changelog

All notable changes to ProxyTunnel VPN Client will be documented in this file.

## [1.2.0] - 2026-08-23

### 🚀 Major Improvements & Features
- **Telegram & Multi-Protocol Windows Routing**: Completely revamped Windows 11 system proxy registry logic to apply `http=host:port;https=host:port;socks=host:port`. Telegram Desktop and multi-protocol clients now instantly route traffic without manual proxy configuration.
- **Theme Switcher (Dark / Light)**: Added one-click theme toggle (☀️/🌙) in the top window header and in General Settings.
- **Process Scanner & Refresh**: Added active Windows process scanning via PowerShell / native API with one-click refresh button in the Split Tunneling "Add App" modal.
- **Native File Dialog**: Added native Windows `.exe` file picker integration in the Split Tunneling modal.
- **Interactive Documentation Reference**: Added a comprehensive guide explaining every UI widget, metric, menu, button, and security setting in the "Help & Documentation" section.
- **Outgoing IP Link**: Updated outbound IP verification button to directly open `https://2ip.io/ru/`.
- **RAM & Render Optimizations**: Reduced polling overhead and memory footprint for background tray execution.

---

## [1.1.0] - 2026-08-15
- Added System Tray minimize-on-close support for Windows 11.
- Added DNS Leak Shield with Cloudflare DoH resolver.
- Added Kill Switch fallback routing.
- Initial release of SOCKS5 / HTTP profile manager.
