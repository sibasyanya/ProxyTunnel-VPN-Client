// Universal Tauri & System Bridge (Supports Tauri v1, Tauri v2, and Browser fallbacks)

export async function tauriInvoke<T = any>(command: string, args?: Record<string, any>): Promise<T> {
  // Check window.__TAURI__ or window.__TAURI_INTERNALS__
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.__TAURI_INTERNALS__?.invoke) {
      return win.__TAURI_INTERNALS__.invoke(command, args);
    }
    if (win.__TAURI__?.invoke) {
      return win.__TAURI__.invoke(command, args);
    }
    if (win.__TAURI__?.tauri?.invoke) {
      return win.__TAURI__.tauri.invoke(command, args);
    }
  }

  try {
    // Try importing from @tauri-apps/api/core (Tauri v2)
    const core = await import('@tauri-apps/api/core');
    if (core && typeof core.invoke === 'function') {
      return (core.invoke as any)(command, args);
    }
  } catch (e) {
    // Ignore import errors in non-tauri environment
  }

  console.log(`[Tauri Bridge Mock] Invoke '${command}' with args:`, args);
  return {} as T;
}

export async function minimizeWindow(): Promise<void> {
  try {
    const win = (typeof window !== 'undefined' ? window : null) as any;
    if (win?.__TAURI__?.window?.appWindow?.minimize) {
      await win.__TAURI__.window.appWindow.minimize();
      return;
    }
    if (win?.__TAURI__?.window?.getCurrentWindow) {
      await win.__TAURI__.window.getCurrentWindow().minimize();
      return;
    }

    const windowModule = await import('@tauri-apps/api/window');
    if (typeof windowModule.getCurrentWindow === 'function') {
      await windowModule.getCurrentWindow().minimize();
    }
  } catch (e) {
    console.log('Minimize window (browser fallback):', e);
  }
}

export async function toggleMaximizeWindow(): Promise<void> {
  try {
    const win = (typeof window !== 'undefined' ? window : null) as any;
    if (win?.__TAURI__?.window?.appWindow?.toggleMaximize) {
      await win.__TAURI__.window.appWindow.toggleMaximize();
      return;
    }
    if (win?.__TAURI__?.window?.getCurrentWindow) {
      await win.__TAURI__.window.getCurrentWindow().toggleMaximize();
      return;
    }

    const windowModule = await import('@tauri-apps/api/window');
    if (typeof windowModule.getCurrentWindow === 'function') {
      await windowModule.getCurrentWindow().toggleMaximize();
    }
  } catch (e) {
    console.log('Toggle maximize (browser fallback):', e);
  }
}

export async function closeWindow(minimizeToTray: boolean = true): Promise<void> {
  try {
    const win = (typeof window !== 'undefined' ? window : null) as any;
    if (minimizeToTray) {
      if (win?.__TAURI__?.window?.appWindow?.hide) {
        await win.__TAURI__.window.appWindow.hide();
        return;
      }
      if (win?.__TAURI__?.window?.getCurrentWindow) {
        await win.__TAURI__.window.getCurrentWindow().hide();
        return;
      }
      const windowModule = await import('@tauri-apps/api/window');
      if (typeof windowModule.getCurrentWindow === 'function') {
        await windowModule.getCurrentWindow().hide();
        return;
      }
    } else {
      if (win?.__TAURI__?.window?.appWindow?.close) {
        await win.__TAURI__.window.appWindow.close();
        return;
      }
      if (win?.__TAURI__?.window?.getCurrentWindow) {
        await win.__TAURI__.window.getCurrentWindow().close();
        return;
      }
      const windowModule = await import('@tauri-apps/api/window');
      if (typeof windowModule.getCurrentWindow === 'function') {
        await windowModule.getCurrentWindow().close();
        return;
      }
    }
  } catch (e) {
    console.log('Close window (browser fallback):', e);
  }
}
