import React from 'react';
import { Shield, Minus, Square, X, Sun, Moon } from 'lucide-react';
import { ConnectionState, AppLanguage, AppTheme, ProxyProfile } from '../types';
import { translations } from '../translations';
import { getCountryFlag } from '../utils/formatters';
import { minimizeWindow, toggleMaximizeWindow, closeWindow } from '../utils/tauriBridge';

interface HeaderProps {
  connectionState: ConnectionState;
  activeProxy: ProxyProfile | null;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  theme: AppTheme;
  onThemeToggle: () => void;
  minimizeToTray?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  connectionState,
  activeProxy,
  language,
  onLanguageChange,
  theme,
  onThemeToggle,
  minimizeToTray = true,
}) => {
  const t = translations[language];

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('[UI] Minimize clicked');
    await minimizeWindow();
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('[UI] Maximize clicked');
    await toggleMaximizeWindow();
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('[UI] Close clicked');
    await closeWindow(minimizeToTray);
  };

  return (
    <header
      className="h-12 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 select-none text-xs text-slate-300 relative z-50"
    >
      {/* Left: App Identity (Draggable area) */}
      <div
        data-tauri-drag-region
        className="flex items-center gap-2.5 cursor-move flex-shrink-0"
      >
        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold pointer-events-none">
          <Shield className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-2 pointer-events-none">
          <span className="font-semibold text-slate-100 tracking-wide text-sm">
            ProxyTunnel
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-emerald-400 font-mono border border-slate-700/60">
            Wintun v0.14
          </span>
        </div>
      </div>

      {/* Middle: Live Connection Status Pill (Draggable spacer) */}
      <div
        data-tauri-drag-region
        className="flex-1 h-full flex items-center justify-center px-4 cursor-move"
      >
        {connectionState === 'connected' ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 animate-fade-in shadow-xs pointer-events-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium text-xs">
              {t.status.connected} • {activeProxy ? `${getCountryFlag(activeProxy.countryCode)} ${activeProxy.name}` : 'Tunnel Active'}
            </span>
          </div>
        ) : connectionState === 'connecting' ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 pointer-events-none">
            <span className="animate-spin h-2 w-2 border-2 border-amber-400 border-t-transparent rounded-full" />
            <span className="font-medium text-xs">{t.status.connecting}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-400 pointer-events-none">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            <span className="font-medium text-xs">{t.status.disconnected}</span>
          </div>
        )}
      </div>

      {/* Right: Language switch + Native Windows 11 window buttons (EXPLICIT NO-DRAG ZONE) */}
      <div
        className="flex items-center gap-3 relative z-50 flex-shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Theme Toggle Button */}
        <button
          type="button"
          id="theme-toggle-btn"
          onClick={(e) => {
            e.stopPropagation();
            onThemeToggle();
          }}
          title={theme === 'dark' ? (language === 'ru' ? 'Включить светлую тему' : 'Switch to Light Mode') : (language === 'ru' ? 'Включить темную тему' : 'Switch to Dark Mode')}
          className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-amber-400 transition cursor-pointer flex items-center justify-center"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-sky-400" />}
        </button>

        {/* Language selector toggle */}
        <div className="flex items-center bg-slate-800/90 rounded-md p-0.5 border border-slate-700">
          <button
            type="button"
            id="lang-btn-ru"
            onClick={(e) => {
              e.stopPropagation();
              onLanguageChange('ru');
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              language === 'ru'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            RU
          </button>
          <button
            type="button"
            id="lang-btn-en"
            onClick={(e) => {
              e.stopPropagation();
              onLanguageChange('en');
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              language === 'en'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            EN
          </button>
        </div>

        {/* Windows 11 Native Interactive Window Controls */}
        <div className="flex items-center space-x-1 text-slate-400 pl-1 border-l border-slate-800">
          <button
            type="button"
            id="win-minimize-btn"
            onClick={handleMinimize}
            title={language === 'ru' ? 'Свернуть' : 'Minimize'}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded transition text-slate-400 hover:text-slate-100 active:scale-90 cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="win-maximize-btn"
            onClick={handleMaximize}
            title={language === 'ru' ? 'Развернуть / Восстановить' : 'Maximize / Restore'}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded transition text-slate-400 hover:text-slate-100 active:scale-90 cursor-pointer"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            type="button"
            id="win-close-btn"
            onClick={handleClose}
            title={
              minimizeToTray
                ? (language === 'ru' ? 'Свернуть в трей' : 'Minimize to Tray')
                : (language === 'ru' ? 'Закрыть' : 'Close')
            }
            className="w-8 h-8 flex items-center justify-center hover:bg-red-600 hover:text-white rounded transition text-slate-400 active:scale-90 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
