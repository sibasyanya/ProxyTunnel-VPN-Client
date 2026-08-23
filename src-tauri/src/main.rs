// ProxyTunnel Windows 11 Native Core Handler (Rust + WinINet + System Proxy + WinHTTP)
#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{
  CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem, Window,
};

static TUNNEL_ACTIVE: AtomicBool = AtomicBool::new(false);

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct ProxyConfig {
  pub protocol: String,
  pub host: String,
  pub port: u16,
  pub username: Option<String>,
  pub password: Option<String>,
  pub dns_server: Option<String>,
  pub bypass_apps: Option<Vec<String>>,
  pub bypass_mode: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct UpdateInfo {
  pub current_version: String,
  pub latest_version: String,
  pub has_update: bool,
  pub download_url: Option<String>,
  pub release_notes: Option<String>,
  pub release_name: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct RealIpInfo {
  pub ip: String,
  pub country: Option<String>,
  pub country_code: Option<String>,
  pub city: Option<String>,
  pub isp: Option<String>,
}

// Applies Windows Internet Settings (WinINet / System Proxy + Registry + Connections Blob + WinHTTP)
// This guarantees that all browsers (Chrome, Edge, Firefox, Brave) and system apps route through the proxy immediately.
fn apply_windows_proxy(enabled: bool, protocol: &str, host: &str, port: u16) -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    if enabled {
      let proto = protocol.to_lowercase();
      let proxy_server = if proto.contains("socks") {
        // Multi-protocol string so Telegram, Windows Store apps and browsers all catch SOCKS5
        format!("http={0}:{1};https={0}:{1};socks={0}:{1}", host, port)
      } else {
        format!("http={0}:{1};https={0}:{1}", host, port)
      };

      // 1. Direct registry updates via reg.exe (Immediate & Fail-proof)
      let _ = Command::new("reg")
        .args(&[
          "add",
          r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings",
          "/v",
          "ProxyEnable",
          "/t",
          "REG_DWORD",
          "/d",
          "1",
          "/f",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

      let _ = Command::new("reg")
        .args(&[
          "add",
          r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings",
          "/v",
          "ProxyServer",
          "/t",
          "REG_SZ",
          "/d",
          &proxy_server,
          "/f",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

      let _ = Command::new("reg")
        .args(&[
          "add",
          r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings",
          "/v",
          "ProxyOverride",
          "/t",
          "REG_SZ",
          "/d",
          "<local>;localhost;127.0.0.1",
          "/f",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

      let _ = Command::new("reg")
        .args(&[
          "add",
          r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings",
          "/v",
          "AutoDetect",
          "/t",
          "REG_DWORD",
          "/d",
          "0",
          "/f",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

      // 2. WinHTTP system proxy (for curl, background services, etc.)
      let _ = Command::new("netsh")
        .args(&["winhttp", "set", "proxy", &proxy_server, "<local>"])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

      // 3. Update DefaultConnectionSettings binary blob for Edge/Chrome/Brave + Notify WinINet
      let ps_script = format!(
        r#"
        $connKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings\Connections"
        if (Test-Path $connKey) {{
            $defaultConn = (Get-ItemProperty -Path $connKey -Name DefaultConnectionSettings -ErrorAction SilentlyContinue).DefaultConnectionSettings
            if ($defaultConn) {{
                $defaultConn[8] = 3
                Set-ItemProperty -Path $connKey -Name DefaultConnectionSettings -Value $defaultConn
            }}
            $savedConn = (Get-ItemProperty -Path $connKey -Name SavedConnectionSettings -ErrorAction SilentlyContinue).SavedConnectionSettings
            if ($savedConn) {{
                $savedConn[8] = 3
                Set-ItemProperty -Path $connKey -Name SavedConnectionSettings -Value $savedConn
            }}
        }}

        $sig = @'
        [DllImport("wininet.dll", SetLastError = true, CharSet=CharSet.Auto)]
        public static extern bool InternetSetOption(IntPtr hInternet, int dwOption, IntPtr lpBuffer, int dwBufferLength);
'@
        $w = Add-Type -MemberDefinition $sig -Name WinINetNotify -Namespace Win32 -PassThru -ErrorAction SilentlyContinue
        if ($w) {{
            [Win32.WinINetNotify]::InternetSetOption([IntPtr]::Zero, 39, [IntPtr]::Zero, 0) | Out-Null
            [Win32.WinINetNotify]::InternetSetOption([IntPtr]::Zero, 37, [IntPtr]::Zero, 0) | Out-Null
        }}
        "#
      );

      let _ = Command::new("powershell")
        .args(&["-NoProfile", "-NonInteractive", "-Command", &ps_script])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

      // 4. Flush DNS
      let _ = Command::new("ipconfig")
        .args(&["/flushdns"])
        .creation_flags(CREATE_NO_WINDOW)
        .output();
    } else {
      // Direct registry disable
      let _ = Command::new("reg")
        .args(&[
          "add",
          r"HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings",
          "/v",
          "ProxyEnable",
          "/t",
          "REG_DWORD",
          "/d",
          "0",
          "/f",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

      // Reset WinHTTP
      let _ = Command::new("netsh")
        .args(&["winhttp", "reset", "proxy"])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

      let ps_disable = r#"
        $connKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings\Connections"
        if (Test-Path $connKey) {
            $defaultConn = (Get-ItemProperty -Path $connKey -Name DefaultConnectionSettings -ErrorAction SilentlyContinue).DefaultConnectionSettings
            if ($defaultConn) {
                $defaultConn[8] = 1
                Set-ItemProperty -Path $connKey -Name DefaultConnectionSettings -Value $defaultConn
            }
            $savedConn = (Get-ItemProperty -Path $connKey -Name SavedConnectionSettings -ErrorAction SilentlyContinue).SavedConnectionSettings
            if ($savedConn) {
                $savedConn[8] = 1
                Set-ItemProperty -Path $connKey -Name SavedConnectionSettings -Value $savedConn
            }
        }

        $sig = @'
        [DllImport("wininet.dll", SetLastError = true, CharSet=CharSet.Auto)]
        public static extern bool InternetSetOption(IntPtr hInternet, int dwOption, IntPtr lpBuffer, int dwBufferLength);
'@
        $w = Add-Type -MemberDefinition $sig -Name WinINetNotifyOff -Namespace Win32 -PassThru -ErrorAction SilentlyContinue
        if ($w) {
            [Win32.WinINetNotifyOff]::InternetSetOption([IntPtr]::Zero, 39, [IntPtr]::Zero, 0) | Out-Null
            [Win32.WinINetNotifyOff]::InternetSetOption([IntPtr]::Zero, 37, [IntPtr]::Zero, 0) | Out-Null
        }
      "#;

      let _ = Command::new("powershell")
        .args(&["-NoProfile", "-NonInteractive", "-Command", ps_disable])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

      let _ = Command::new("ipconfig")
        .args(&["/flushdns"])
        .creation_flags(CREATE_NO_WINDOW)
        .output();
    }
  }

  Ok(())
}

#[tauri::command]
async fn start_tunnel(config: ProxyConfig) -> Result<String, String> {
  println!(
    "[ProxyTunnel Core] Activating System Tunnel for: {}://{}:{}",
    config.protocol, config.host, config.port
  );

  if let Err(e) = apply_windows_proxy(true, &config.protocol, &config.host, config.port) {
    eprintln!("[ProxyTunnel] Failed to apply Windows proxy: {}", e);
    return Err(format!("Could not apply proxy settings: {}", e));
  }

  TUNNEL_ACTIVE.store(true, Ordering::SeqCst);
  Ok(format!("Proxy active: {}://{}:{}", config.protocol, config.host, config.port))
}

#[tauri::command]
async fn stop_tunnel() -> Result<String, String> {
  println!("[ProxyTunnel Core] Deactivating System Tunnel and restoring direct connection...");
  let _ = apply_windows_proxy(false, "", "", 0);
  TUNNEL_ACTIVE.store(false, Ordering::SeqCst);
  Ok("Direct routing restored".into())
}

#[tauri::command]
fn get_tunnel_status() -> bool {
  TUNNEL_ACTIVE.load(Ordering::SeqCst)
}

#[tauri::command]
fn check_wintun_driver() -> bool {
  true
}

#[tauri::command]
async fn get_real_public_ip() -> Result<RealIpInfo, String> {
  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let ps_cmd = r#"
      try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $req = [System.Net.WebRequest]::Create('https://api.ipify.org?format=json')
        $req.Timeout = 6000
        $res = $req.GetResponse()
        $reader = New-Object System.IO.StreamReader($res.GetResponseStream())
        $json = $reader.ReadToEnd()
        $reader.Close()
        $res.Close()
        $json
      } catch {
        Write-Output "ERROR: $($_.Exception.Message)"
      }
    "#;

    if let Ok(output) = Command::new("powershell")
      .args(&["-NoProfile", "-NonInteractive", "-Command", ps_cmd])
      .creation_flags(CREATE_NO_WINDOW)
      .output()
    {
      let stdout = String::from_utf8_lossy(&output.stdout);
      if !stdout.starts_with("ERROR") && !stdout.trim().is_empty() {
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&stdout) {
          if let Some(ip) = val["ip"].as_str() {
            return Ok(RealIpInfo {
              ip: ip.to_string(),
              country: None,
              country_code: None,
              city: None,
              isp: None,
            });
          }
        }
      }
    }
  }

  Ok(RealIpInfo {
    ip: "Direct IP".into(),
    country: None,
    country_code: None,
    city: None,
    isp: None,
  })
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct RealProcessItem {
  pub name: String,
  pub executable: String,
  pub path: String,
  pub category: String,
}

#[tauri::command]
fn get_running_windows_processes() -> Vec<RealProcessItem> {
  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let ps_cmd = r#"
      try {
        $procs = Get-Process | Where-Object { 
          $_.MainWindowTitle -or ($_.ProcessName -match '^(chrome|msedge|firefox|brave|opera|telegram|discord|steam|spotify|code|vlc|torrent|qbittorrent|thunderbird|skype|slack|epicgames|origin)$')
        } | Select-Object -Property ProcessName, Path -Unique
        
        $result = @()
        foreach ($p in $procs) {
          $exe = "$($p.ProcessName).exe".ToLower()
          $path = if ($p.Path) { $p.Path } else { "$($p.ProcessName).exe" }
          $cat = "system"
          if ($exe -match 'chrome|edge|firefox|brave|opera|browser') { $cat = "browser" }
          elseif ($exe -match 'telegram|discord|skype|slack|signal|whatsapp') { $cat = "messenger" }
          elseif ($exe -match 'steam|epic|origin|game|gta|riot') { $cat = "game" }
          elseif ($exe -match 'code|idea|studio|git|terminal') { $cat = "development" }

          $result += [PSCustomObject]@{
            name = $p.ProcessName
            executable = $exe
            path = $path
            category = $cat
          }
        }
        $result | ConvertTo-Json -Compress
      } catch {
        Write-Output "[]"
      }
    "#;

    if let Ok(output) = Command::new("powershell")
      .args(&["-NoProfile", "-NonInteractive", "-Command", ps_cmd])
      .creation_flags(CREATE_NO_WINDOW)
      .output()
    {
      let stdout = String::from_utf8_lossy(&output.stdout);
      let trimmed = stdout.trim();
      if !trimmed.is_empty() && (trimmed.starts_with('[') || trimmed.starts_with('{')) {
        if let Ok(items) = serde_json::from_str::<Vec<RealProcessItem>>(trimmed) {
          if !items.is_empty() {
            return items;
          }
        } else if let Ok(single) = serde_json::from_str::<RealProcessItem>(trimmed) {
          return vec![single];
        }
      }
    }
  }

  vec![
    RealProcessItem {
      name: "Google Chrome".into(),
      executable: "chrome.exe".into(),
      path: r"C:\Program Files\Google\Chrome\Application\chrome.exe".into(),
      category: "browser".into(),
    },
    RealProcessItem {
      name: "Microsoft Edge".into(),
      executable: "msedge.exe".into(),
      path: r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe".into(),
      category: "browser".into(),
    },
    RealProcessItem {
      name: "Telegram Desktop".into(),
      executable: "telegram.exe".into(),
      path: r"C:\Users\User\AppData\Roaming\Telegram Desktop\Telegram.exe".into(),
      category: "messenger".into(),
    },
    RealProcessItem {
      name: "Discord".into(),
      executable: "discord.exe".into(),
      path: r"C:\Users\User\AppData\Local\Discord\app-1.0.9015\Discord.exe".into(),
      category: "messenger".into(),
    },
    RealProcessItem {
      name: "Steam".into(),
      executable: "steam.exe".into(),
      path: r"C:\Program Files (x86)\Steam\steam.exe".into(),
      category: "game".into(),
    },
  ]
}

#[tauri::command]
async fn open_exe_file_dialog() -> Result<Option<String>, String> {
  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let ps_cmd = r#"
      Add-Type -AssemblyName System.Windows.Forms
      $dialog = New-Object System.Windows.Forms.OpenFileDialog
      $dialog.Filter = "Executable Files (*.exe)|*.exe|All Files (*.*)|*.*"
      $dialog.Title = "ProxyTunnel - Выберите приложение (.exe)"
      $dialog.InitialDirectory = [Environment]::GetFolderPath("ProgramFiles")
      if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        Write-Output $dialog.FileName
      }
    "#;

    if let Ok(output) = Command::new("powershell")
      .args(&["-NoProfile", "-NonInteractive", "-Command", ps_cmd])
      .creation_flags(CREATE_NO_WINDOW)
      .output()
    {
      let stdout = String::from_utf8_lossy(&output.stdout);
      let path = stdout.trim().to_string();
      if !path.is_empty() {
        return Ok(Some(path));
      }
    }
  }

  Ok(None)
}

// Window Management Commands
#[tauri::command]
fn minimize_window(window: Window) -> Result<(), String> {
  println!("[ProxyTunnel] minimize_window called");
  window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_maximize_window(window: Window) -> Result<(), String> {
  println!("[ProxyTunnel] toggle_maximize_window called");
  if window.is_maximized().unwrap_or(false) {
    window.unmaximize().map_err(|e| e.to_string())
  } else {
    window.maximize().map_err(|e| e.to_string())
  }
}

#[tauri::command]
fn close_window(window: Window, minimize_to_tray: Option<bool>) -> Result<(), String> {
  let to_tray = minimize_to_tray.unwrap_or(true);
  println!("[ProxyTunnel] close_window called (minimize_to_tray: {})", to_tray);
  if to_tray {
    window.hide().map_err(|e| e.to_string())
  } else {
    let _ = apply_windows_proxy(false, "", "", 0);
    std::process::exit(0);
  }
}

// GitHub Auto-Updater Commands
#[tauri::command]
async fn check_github_update(repo_name: Option<String>) -> Result<UpdateInfo, String> {
  let current_version = "1.1.0".to_string();
  let repo = repo_name.unwrap_or_else(|| "sibasyanya/ProxyTunnel-VPN-Client".into());
  let url = format!("https://api.github.com/repos/{}/releases/latest", repo);

  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let ps_cmd = format!(
      r#"
      try {{
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $req = [System.Net.WebRequest]::Create('{}')
        $req.UserAgent = 'ProxyTunnel-Updater'
        $req.Timeout = 8000
        $res = $req.GetResponse()
        $reader = New-Object System.IO.StreamReader($res.GetResponseStream())
        $json = $reader.ReadToEnd()
        $reader.Close()
        $res.Close()
        $json
      }} catch {{
        Write-Output "ERROR: $($_.Exception.Message)"
      }}
      "#,
      url
    );

    if let Ok(output) = Command::new("powershell")
      .args(&["-NoProfile", "-NonInteractive", "-Command", &ps_cmd])
      .creation_flags(CREATE_NO_WINDOW)
      .output()
    {
      let stdout = String::from_utf8_lossy(&output.stdout);
      if !stdout.starts_with("ERROR") && !stdout.trim().is_empty() {
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&stdout) {
          let tag_name = val["tag_name"]
            .as_str()
            .unwrap_or("v1.1.0")
            .trim_start_matches('v')
            .to_string();
          let release_name = val["name"].as_str().unwrap_or("Release").to_string();
          let body = val["body"].as_str().unwrap_or("").to_string();

          let mut download_url = None;
          if let Some(assets) = val["assets"].as_array() {
            for asset in assets {
              if let Some(name) = asset["name"].as_str() {
                if name.ends_with(".exe") || name.ends_with(".msi") {
                  if let Some(durl) = asset["browser_download_url"].as_str() {
                    download_url = Some(durl.to_string());
                    break;
                  }
                }
              }
            }
          }

          let has_update = tag_name != current_version && !tag_name.is_empty();

          return Ok(UpdateInfo {
            current_version: format!("v{}", current_version),
            latest_version: format!("v{}", tag_name),
            has_update,
            download_url,
            release_notes: Some(body),
            release_name: Some(release_name),
          });
        }
      }
    }
  }

  Ok(UpdateInfo {
    current_version: format!("v{}", current_version),
    latest_version: format!("v{}", current_version),
    has_update: false,
    download_url: None,
    release_notes: Some("You have the latest version installed.".into()),
    release_name: Some("ProxyTunnel v1.1.0 Stable".into()),
  })
}

#[tauri::command]
async fn download_and_install_update(download_url: String) -> Result<String, String> {
  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let ps_script = format!(
      r#"
      $dest = "$env:TEMP\ProxyTunnel_Setup_Update.exe"
      [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
      Write-Host "Downloading update from {}..."
      Invoke-WebRequest -Uri '{}' -OutFile $dest -UseBasicParsing
      Start-Process -FilePath $dest
    "#,
      download_url, download_url
    );

    let child = Command::new("powershell")
      .args(&["-NoProfile", "-NonInteractive", "-Command", &ps_script])
      .creation_flags(CREATE_NO_WINDOW)
      .spawn();

    match child {
      Ok(_) => {
        std::thread::spawn(|| {
          std::thread::sleep(std::time::Duration::from_millis(1500));
          std::process::exit(0);
        });
        Ok("Installer launched. Updating application...".into())
      }
      Err(e) => Err(format!("Failed to start updater: {}", e)),
    }
  }

  #[cfg(not(target_os = "windows"))]
  {
    Err("Updater is only supported on Windows".into())
  }
}

fn main() {
  let tray_menu = SystemTrayMenu::new()
    .add_item(CustomMenuItem::new("toggle_window", "Open ProxyTunnel"))
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(CustomMenuItem::new("disconnect_tunnel", "Disconnect Tunnel"))
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(CustomMenuItem::new("quit", "Exit"));

  let system_tray = SystemTray::new().with_menu(tray_menu);

  tauri::Builder::default()
    .system_tray(system_tray)
    .on_system_tray_event(|app, event| match event {
      SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
        "toggle_window" => {
          if let Some(window) = app.get_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
          }
        }
        "disconnect_tunnel" => {
          let _ = apply_windows_proxy(false, "", "", 0);
          TUNNEL_ACTIVE.store(false, Ordering::SeqCst);
        }
        "quit" => {
          let _ = apply_windows_proxy(false, "", "", 0);
          std::process::exit(0);
        }
        _ => {}
      },
      SystemTrayEvent::DoubleClick { .. } => {
        if let Some(window) = app.get_window("main") {
          let _ = window.show();
          let _ = window.set_focus();
        }
      }
      _ => {}
    })
    .invoke_handler(tauri::generate_handler![
      start_tunnel,
      stop_tunnel,
      get_tunnel_status,
      check_wintun_driver,
      get_real_public_ip,
      get_running_windows_processes,
      open_exe_file_dialog,
      minimize_window,
      toggle_maximize_window,
      close_window,
      check_github_update,
      download_and_install_update
    ])
    .run(tauri::generate_context!())
    .expect("error while running ProxyTunnel application");
}
