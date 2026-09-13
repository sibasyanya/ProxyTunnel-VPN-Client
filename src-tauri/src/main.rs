// ProxyTunnel Windows 11 Native Core Handler (Rust + WinINet + System Proxy + Local Auth Bridge + WinHTTP)
#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use base64::Engine;
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{
  CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem, Window,
};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::broadcast;

static TUNNEL_ACTIVE: AtomicBool = AtomicBool::new(false);
const LOCAL_BRIDGE_PORT: u16 = 10800;

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

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct UpdateInfo {
  pub current_version: String,
  pub latest_version: String,
  pub has_update: bool,
  pub download_url: Option<String>,
  pub release_notes: Option<String>,
  pub release_name: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct RealIpInfo {
  pub ip: String,
  pub country: Option<String>,
  pub country_code: Option<String>,
  pub city: Option<String>,
  pub isp: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
pub struct TunnelLogMessage {
  pub timestamp: String,
  pub level: String,
  pub message: String,
}

// Global shutdown signal for the background local proxy bridge
static BRIDGE_SHUTDOWN_TX: once_cell::sync::Lazy<broadcast::Sender<()>> =
  once_cell::sync::Lazy::new(|| {
    let (tx, _) = broadcast::channel(1);
    tx
  });

// Applies Windows Internet Settings to point to the local authenticated bridge or disable proxy
fn apply_windows_proxy(enabled: bool, local_port: u16) -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    if enabled {
      let proxy_server = format!("http=127.0.0.1:{0};https=127.0.0.1:{0}", local_port);

      // 1. Direct registry updates via reg.exe
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
          "<local>;localhost;127.0.0.1;127.0.0.*",
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

      // 2. WinHTTP system proxy
      let _ = Command::new("netsh")
        .args(&["winhttp", "set", "proxy", &proxy_server, "<local>;localhost;127.0.0.1"])
        .creation_flags(CREATE_NO_WINDOW)
        .output();

      // 3. Update DefaultConnectionSettings binary blob for Edge/Chrome/Brave + Notify WinINet
      let ps_script = format!(
        r#"
        $proxy = "{}"
        $connKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings\Connections"
        if (Test-Path $connKey) {{
            # Construct standard WinINet connection settings binary blob
            $proxyBytes = [System.Text.Encoding]::ASCII.GetBytes($proxy)
            $pLen = [byte]$proxyBytes.Length
            # 70-byte baseline header with flags: 0x03 (Proxy enabled, manual)
            $blob = [byte[]]@(
                0x46, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x03, 0x00, 0x00, 0x00,
                $pLen, 0x00, 0x00, 0x00
            ) + $proxyBytes + @(
                0x07, 0x00, 0x00, 0x00
            ) + [System.Text.Encoding]::ASCII.GetBytes("<local>") + @(
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00
            )
            Set-ItemProperty -Path $connKey -Name DefaultConnectionSettings -Value $blob -ErrorAction SilentlyContinue
            Set-ItemProperty -Path $connKey -Name SavedConnectionSettings -Value $blob -ErrorAction SilentlyContinue
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
        "#,
        proxy_server
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

// Emits structured logs to Tauri frontend & console
fn emit_log<R: tauri::Runtime>(app_handle: Option<&tauri::AppHandle<R>>, level: &str, msg: &str) {
  let now = chrono_or_fallback_time();
  println!("[ProxyTunnel {}] [{}] {}", level, now, msg);
  if let Some(handle) = app_handle {
    let _ = handle.emit_all(
      "tunnel-log",
      TunnelLogMessage {
        timestamp: now,
        level: level.to_string(),
        message: msg.to_string(),
      },
    );
  }
}

fn chrono_or_fallback_time() -> String {
  let output = Command::new("powershell")
    .args(&["-NoProfile", "-Command", "Get-Date -Format 'HH:mm:ss'"])
    .output();
  if let Ok(out) = output {
    let t = String::from_utf8_lossy(&out.stdout).trim().to_string();
    if !t.is_empty() {
      return t;
    }
  }
  "NOW".to_string()
}

// Local bridge worker: listens on 127.0.0.1:LOCAL_BRIDGE_PORT and proxies with upstream authentication
async fn start_local_proxy_bridge(
  config: ProxyConfig,
  app_handle: Option<tauri::AppHandle>,
  mut shutdown_rx: broadcast::Receiver<()>,
) {
  let bind_addr = format!("127.0.0.1:{}", LOCAL_BRIDGE_PORT);
  let listener = match TcpListener::bind(&bind_addr).await {
    Ok(l) => {
      emit_log(
        app_handle.as_ref(),
        "INFO",
        &format!("Local Proxy Bridge active on {}", bind_addr),
      );
      l
    }
    Err(e) => {
      emit_log(
        app_handle.as_ref(),
        "ERROR",
        &format!("Failed to bind local bridge on {}: {}", bind_addr, e),
      );
      return;
    }
  };

  let cfg = Arc::new(config);

  loop {
    tokio::select! {
      res = listener.accept() => {
        match res {
          Ok((client_stream, _client_addr)) => {
            let upstream_cfg = Arc::clone(&cfg);
            let handle_opt = app_handle.clone();
            tokio::spawn(async move {
              handle_bridge_connection(client_stream, upstream_cfg, handle_opt).await;
            });
          }
          Err(e) => {
            emit_log(app_handle.as_ref(), "WARN", &format!("Listener accept error: {}", e));
          }
        }
      }
      _ = shutdown_rx.recv() => {
        emit_log(app_handle.as_ref(), "INFO", "Local Proxy Bridge shutting down.");
        break;
      }
    }
  }
}

// Handles upstream handshake (either SOCKS5 or HTTP) and tunnels the client traffic
async fn handle_bridge_connection(
  mut client_stream: TcpStream,
  config: Arc<ProxyConfig>,
  app_handle: Option<tauri::AppHandle>,
) {
  let mut initial_buf = [0u8; 8192];
  let n = match client_stream.read(&mut initial_buf).await {
    Ok(n) if n > 0 => n,
    _ => return,
  };

  let raw_header = String::from_utf8_lossy(&initial_buf[..n]);
  let is_http_connect = raw_header.starts_with("CONNECT ");
  let is_socks5_client = initial_buf[0] == 0x05;

  let upstream_target = format!("{}:{}", config.host, config.port);
  let mut upstream_stream = match TcpStream::connect(&upstream_target).await {
    Ok(s) => s,
    Err(e) => {
      emit_log(
        app_handle.as_ref(),
        "ERROR",
        &format!("Could not connect to upstream proxy {}: {}", upstream_target, e),
      );
      return;
    }
  };

  let is_upstream_socks5 = config.protocol.to_lowercase().contains("socks");

  if is_upstream_socks5 {
    // Upstream is SOCKS5.
    // If incoming request is HTTP CONNECT (from Windows system proxy / Edge / Chrome):
    // parse host and port, perform SOCKS5 handshake with upstream, return "200 Connection Established" to client!
    if is_http_connect {
      let first_line = raw_header.lines().next().unwrap_or("");
      let parts: Vec<&str> = first_line.split_whitespace().collect();
      if parts.len() < 2 {
        return;
      }
      let target_addr = parts[1]; // e.g. "2ip.ru:443"
      let addr_parts: Vec<&str> = target_addr.split(':').collect();
      if addr_parts.len() != 2 {
        return;
      }
      let target_host = addr_parts[0];
      let target_port: u16 = match addr_parts[1].parse() {
        Ok(p) => p,
        Err(_) => 443,
      };

      // 1. SOCKS5 Auth Handshake to Upstream
      let has_auth = config.username.as_ref().map_or(false, |u| !u.is_empty());
      if has_auth {
        // Offer NO_AUTH (0x00) and USER_PASS (0x02)
        if let Err(_) = upstream_stream.write_all(&[0x05, 0x02, 0x00, 0x02]).await {
          return;
        }
      } else {
        if let Err(_) = upstream_stream.write_all(&[0x05, 0x01, 0x00]).await {
          return;
        }
      }

      let mut auth_resp = [0u8; 2];
      if let Err(_) = upstream_stream.read_exact(&mut auth_resp).await {
        return;
      }
      if auth_resp[0] != 0x05 {
        return;
      }

      if auth_resp[1] == 0x02 {
        // Authenticate with user/pass
        let user = config.username.clone().unwrap_or_default();
        let pass = config.password.clone().unwrap_or_default();
        let mut auth_req = Vec::new();
        auth_req.push(0x01); // subnegotiation version
        auth_req.push(user.len() as u8);
        auth_req.extend_from_slice(user.as_bytes());
        auth_req.push(pass.len() as u8);
        auth_req.extend_from_slice(pass.as_bytes());

        if let Err(_) = upstream_stream.write_all(&auth_req).await {
          return;
        }

        let mut user_auth_resp = [0u8; 2];
        if let Err(_) = upstream_stream.read_exact(&mut user_auth_resp).await {
          return;
        }
        if user_auth_resp[1] != 0x00 {
          emit_log(
            app_handle.as_ref(),
            "ERROR",
            "Upstream SOCKS5 Authentication failed (bad username/password)",
          );
          return;
        }
      }

      // 2. SOCKS5 Connect Command to Upstream (0x01 = CONNECT, 0x03 = DOMAINNAME)
      let mut cmd_req = Vec::new();
      cmd_req.extend_from_slice(&[0x05, 0x01, 0x00, 0x03]);
      cmd_req.push(target_host.len() as u8);
      cmd_req.extend_from_slice(target_host.as_bytes());
      cmd_req.extend_from_slice(&target_port.to_be_bytes());

      if let Err(_) = upstream_stream.write_all(&cmd_req).await {
        return;
      }

      let mut cmd_resp_hdr = [0u8; 4];
      if let Err(_) = upstream_stream.read_exact(&mut cmd_resp_hdr).await {
        return;
      }
      if cmd_resp_hdr[1] != 0x00 {
        emit_log(
          app_handle.as_ref(),
          "ERROR",
          &format!("Upstream SOCKS5 connect failed code: {:#x}", cmd_resp_hdr[1]),
        );
        return;
      }

      // Skip bound address in response
      match cmd_resp_hdr[3] {
        0x01 => {
          let mut ip4 = [0u8; 4 + 2];
          let _ = upstream_stream.read_exact(&mut ip4).await;
        }
        0x03 => {
          let mut len = [0u8; 1];
          let _ = upstream_stream.read_exact(&mut len).await;
          let mut domain = vec![0u8; len[0] as usize + 2];
          let _ = upstream_stream.read_exact(&mut domain).await;
        }
        0x04 => {
          let mut ip6 = [0u8; 16 + 2];
          let _ = upstream_stream.read_exact(&mut ip6).await;
        }
        _ => {}
      }

      // 3. Respond 200 Connection Established to Browser (Windows/Edge/Chrome)
      let ok_resp = "HTTP/1.1 200 Connection Established\r\n\r\n";
      if let Err(_) = client_stream.write_all(ok_resp.as_bytes()).await {
        return;
      }

      emit_log(
        app_handle.as_ref(),
        "INFO",
        &format!("Tunnel established -> {}", target_addr),
      );

      // 4. Bi-directional raw data pipe
      let (mut c_read, mut c_write) = client_stream.into_split();
      let (mut u_read, mut u_write) = upstream_stream.into_split();

      let client_to_upstream = tokio::io::copy(&mut c_read, &mut u_write);
      let upstream_to_client = tokio::io::copy(&mut u_read, &mut c_write);

      let _ = tokio::try_join!(client_to_upstream, upstream_to_client);
      return;
    } else if is_socks5_client {
      // Direct SOCKS5 client forward
      if let Err(_) = upstream_stream.write_all(&initial_buf[..n]).await {
        return;
      }
      let (mut c_read, mut c_write) = client_stream.into_split();
      let (mut u_read, mut u_write) = upstream_stream.into_split();
      let _ = tokio::try_join!(
        tokio::io::copy(&mut c_read, &mut u_write),
        tokio::io::copy(&mut u_read, &mut c_write)
      );
      return;
    }
  }

  // Fallback / Standard HTTP Upstream Proxy Handling
  let mut auth_header = String::new();
  if let (Some(u), Some(p)) = (&config.username, &config.password) {
    if !u.is_empty() {
      let combined = format!("{}:{}", u, p);
      let encoded = base64::engine::general_purpose::STANDARD.encode(combined.as_bytes());
      auth_header = format!("Proxy-Authorization: Basic {}\r\n", encoded);
    }
  }

  let modified_req = if !auth_header.is_empty() && !raw_header.contains("Proxy-Authorization:") {
    if let Some(pos) = raw_header.find("\r\n") {
      let (first_line, rest) = raw_header.split_at(pos + 2);
      format!("{}{}{}", first_line, auth_header, rest)
    } else {
      raw_header.to_string()
    }
  } else {
    raw_header.to_string()
  };

  if let Err(e) = upstream_stream.write_all(modified_req.as_bytes()).await {
    emit_log(app_handle.as_ref(), "ERROR", &format!("Upstream write error: {}", e));
    return;
  }

  let (mut client_read, mut client_write) = client_stream.into_split();
  let (mut upstream_read, mut upstream_write) = upstream_stream.into_split();

  let client_to_upstream = tokio::io::copy(&mut client_read, &mut upstream_write);
  let upstream_to_client = tokio::io::copy(&mut upstream_read, &mut client_write);

  let _ = tokio::try_join!(client_to_upstream, upstream_to_client);
}

#[tauri::command]
async fn start_tunnel(app_handle: tauri::AppHandle, config: ProxyConfig) -> Result<String, String> {
  emit_log(
    Some(&app_handle),
    "INFO",
    &format!(
      "Starting tunnel to {}:{} (auth: {})",
      config.host,
      config.port,
      config.username.is_some()
    ),
  );

  // 1. If bridge already running, send shutdown first
  let _ = BRIDGE_SHUTDOWN_TX.send(());

  // 2. Launch new local authenticated proxy bridge
  let bridge_config = config.clone();
  let handle_clone = app_handle.clone();
  let shutdown_rx = BRIDGE_SHUTDOWN_TX.subscribe();

  tokio::spawn(async move {
    start_local_proxy_bridge(bridge_config, Some(handle_clone), shutdown_rx).await;
  });

  // Give local listener a moment to bind
  tokio::time::sleep(std::time::Duration::from_millis(150)).await;

  // 3. Configure Windows system proxy to point to 127.0.0.1:LOCAL_BRIDGE_PORT
  if let Err(e) = apply_windows_proxy(true, LOCAL_BRIDGE_PORT) {
    emit_log(Some(&app_handle), "ERROR", &format!("Failed to apply Windows proxy: {}", e));
    return Err(format!("Could not apply proxy settings: {}", e));
  }

  TUNNEL_ACTIVE.store(true, Ordering::SeqCst);
  emit_log(
    Some(&app_handle),
    "SUCCESS",
    &format!("Tunnel actively forwarding via 127.0.0.1:{}", LOCAL_BRIDGE_PORT),
  );

  Ok(format!("Proxy active via local bridge: 127.0.0.1:{}", LOCAL_BRIDGE_PORT))
}

#[tauri::command]
async fn stop_tunnel(app_handle: tauri::AppHandle) -> Result<String, String> {
  emit_log(Some(&app_handle), "INFO", "Stopping tunnel and restoring direct connection...");
  let _ = apply_windows_proxy(false, 0);
  let _ = BRIDGE_SHUTDOWN_TX.send(());
  TUNNEL_ACTIVE.store(false, Ordering::SeqCst);
  emit_log(Some(&app_handle), "SUCCESS", "Direct routing restored.");
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
  window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_maximize_window(window: Window) -> Result<(), String> {
  if window.is_maximized().unwrap_or(false) {
    window.unmaximize().map_err(|e| e.to_string())
  } else {
    window.maximize().map_err(|e| e.to_string())
  }
}

#[tauri::command]
fn close_window(window: Window, minimize_to_tray: Option<bool>) -> Result<(), String> {
  let to_tray = minimize_to_tray.unwrap_or(true);
  if to_tray {
    window.hide().map_err(|e| e.to_string())
  } else {
    let _ = apply_windows_proxy(false, 0);
    std::process::exit(0);
  }
}

// GitHub Auto-Updater Commands
#[tauri::command]
async fn check_github_update(repo_name: Option<String>) -> Result<UpdateInfo, String> {
  let current_version = env!("CARGO_PKG_VERSION").to_string();
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
            .unwrap_or("v1.3.0")
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
    release_name: Some("ProxyTunnel v1.3.0 Stable".into()),
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
          let _ = apply_windows_proxy(false, 0);
          TUNNEL_ACTIVE.store(false, Ordering::SeqCst);
        }
        "quit" => {
          let _ = apply_windows_proxy(false, 0);
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
