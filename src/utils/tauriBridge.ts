// Universal Tauri & System Bridge (Safe for Tauri v1 runtime and Vite bundling)

export async function tauriInvoke<T = any>(command: string, args?: Record<string, any>): Promise<T> {
  if (typeof window !== 'undefined') {
    const win = window as any;
    
    // Tauri v1 standard global invoke
    if (win.__TAURI__?.invoke) {
      return win.__TAURI__.invoke(command, args);
    }
    if (win.__TAURI__?.tauri?.invoke) {
      return win.__TAURI__.tauri.invoke(command, args);
    }
    // Tauri v1 internal IPC
    if (typeof win.__TAURI_INVOKE__ === 'function') {
      return win.__TAURI_INVOKE__(command, args);
    }
    // Tauri v2 internals
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
  // Call Rust backend command directly
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
  // Call Rust backend command directly
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
    } else {
      if (win?.__TAURI__?.window?.appWindow?.close) {
        await win.__TAURI__.window.appWindow.close();
        return;
      }
      if (win?.__TAURI__?.window?.getCurrent?.()?.close) {
        await win.__TAURI__.window.getCurrent().close();
        return;
      }
    }
  } catch (e) {
    console.log('Close window fallback invoke:', e);
  }
  await tauriInvoke('close_window', { minimizeToTray });
}

export async function openFileDialog(): Promise<string | null> {
  console.log('[Bridge] openFileDialog triggered');
  try {
    const win = (typeof window !== 'undefined' ? window : null) as any;
    if (win?.__TAURI__?.dialog?.open) {
      const selected = await win.__TAURI__.dialog.open({
        filters: [{ name: 'Executable (.exe)', extensions: ['exe'] }, { name: 'All Files', extensions: ['*'] }],
        multiple: false,
      });
      if (typeof selected === 'string') return selected;
      if (Array.isArray(selected) && selected.length > 0) return selected[0];
    }
  } catch (e) {
    console.log('Tauri dialog.open fallback to invoke:', e);
  }
  
  try {
    const res = await tauriInvoke<string | null>('open_exe_file_dialog');
    if (res) return res;
  } catch (e) {
    console.log('open_exe_file_dialog invoke error:', e);
  }
  return null;
}

export async function fetchRunningProcesses(): Promise<Array<{ name: string; executable: string; path: string; category: string }>> {
  try {
    const res = await tauriInvoke<any>('get_running_windows_processes');
    if (Array.isArray(res) && res.length > 0) {
      return res.map((item: any) => {
        if (typeof item === 'string') {
          const name = item.replace(/\.exe$/i, '');
          return {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            executable: item,
            path: item,
            category: 'system',
          };
        }
        return item;
      });
    }
  } catch (e) {
    console.log('fetchRunningProcesses fallback:', e);
  }
  return [];
}

export function tauriListen<T = any>(event: string, handler: (payload: T) => void): () => void {
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.__TAURI__?.event?.listen) {
      let unlistenPromise = win.__TAURI__.event.listen(event, (ev: any) => {
        handler(ev.payload);
      });
      return () => {
        unlistenPromise.then((unlisten: any) => unlisten());
      };
    }
  }
  return () => {};
}
