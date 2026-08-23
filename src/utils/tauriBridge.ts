// Universal Tauri & System Bridge (Safe for Tauri v1 runtime and Vite bundling)

export async function tauriInvoke<T = any>(command: string, args?: Record<string, any>): Promise<T> {
  if (typeof window !== 'undefined') {
    const win = window as any;
    // Tauri v1 standard
    if (win.__TAURI__?.invoke) {
      return win.__TAURI__.invoke(command, args);
    }
    if (win.__TAURI__?.tauri?.invoke) {
      return win.__TAURI__.tauri.invoke(command, args);
    }
    if (win.__TAURI_INTERNALS__?.invoke) {
      return win.__TAURI_INTERNALS__.invoke(command, args);
    }
  }

  console.log(`[Tauri Bridge Web/Fallback] Invoke '${command}' with args:`, args);
  return {} as T;
}

export async function minimizeWindow(): Promise<void> {
  console.log('[Bridge] minimizeWindow triggered');
  try {
    const win = (typeof window !== 'undefined' ? window : null) as any;
    if (win?.__TAURI__?.window?.appWindow?.minimize) {
      await win.__TAURI__.window.appWindow.minimize();
      return;
    }
    if (win?.__TAURI__?.window?.getCurrent?.()?.minimize) {
      await win.__TAURI__.window.getCurrent().minimize();
      return;
    }
  } catch (e) {
    console.log('Tauri window.appWindow.minimize error, falling back to invoke:', e);
  }
  // Call Rust backend command
  await tauriInvoke('minimize_window');
}

export async function toggleMaximizeWindow(): Promise<void> {
  console.log('[Bridge] toggleMaximizeWindow triggered');
  try {
    const win = (typeof window !== 'undefined' ? window : null) as any;
    if (win?.__TAURI__?.window?.appWindow?.toggleMaximize) {
      await win.__TAURI__.window.appWindow.toggleMaximize();
      return;
    }
    if (win?.__TAURI__?.window?.getCurrent?.()?.toggleMaximize) {
      await win.__TAURI__.window.getCurrent().toggleMaximize();
      return;
    }
  } catch (e) {
    console.log('Tauri window.appWindow.toggleMaximize error, falling back to invoke:', e);
  }
  // Call Rust backend command
  await tauriInvoke('toggle_maximize_window');
}

export async function closeWindow(minimizeToTray: boolean = true): Promise<void> {
  console.log('[Bridge] closeWindow triggered (minimizeToTray:', minimizeToTray, ')');
  try {
    const win = (typeof window !== 'undefined' ? window : null) as any;
    if (minimizeToTray) {
      if (win?.__TAURI__?.window?.appWindow?.hide) {
        await win.__TAURI__.window.appWindow.hide();
        return;
      }
      if (win?.__TAURI__?.window?.getCurrent?.()?.hide) {
        await win.__TAURI__.window.getCurrent().hide();
        return;
      }
      await tauriInvoke('close_window', { minimizeToTray: true });
    } else {
      if (win?.__TAURI__?.window?.appWindow?.close) {
        await win.__TAURI__.window.appWindow.close();
        return;
      }
      if (win?.__TAURI__?.window?.getCurrent?.()?.close) {
        await win.__TAURI__.window.getCurrent().close();
        return;
      }
      await tauriInvoke('close_window', { minimizeToTray: false });
    }
  } catch (e) {
    console.log('Close window fallback invoke:', e);
    await tauriInvoke('close_window', { minimizeToTray });
  }
}
