import React, { useState } from 'react';
import {
  Split,
  Plus,
  Search,
  Trash2,
  Globe,
  MessageSquare,
  Gamepad2,
  Code,
  Laptop,
  CheckCircle2,
  Info,
  Shield,
  Layers,
} from 'lucide-react';
import { BypassApp, BypassMode, AppLanguage } from '../types';
import { translations } from '../translations';

interface SplitTunnelingViewProps {
  bypassApps: BypassApp[];
  bypassMode: BypassMode;
  onBypassModeChange: (mode: BypassMode) => void;
  onToggleApp: (id: string) => void;
  onDeleteApp: (id: string) => void;
  onOpenAddModal: () => void;
  language: AppLanguage;
}

export const SplitTunnelingView: React.FC<SplitTunnelingViewProps> = ({
  bypassApps,
  bypassMode,
  onBypassModeChange,
  onToggleApp,
  onDeleteApp,
  onOpenAddModal,
  language,
}) => {
  const t = translations[language].splitTunnel;
  const [searchQuery, setSearchQuery] = useState('');

  const activeCount = bypassApps.filter((a) => a.enabled).length;

  const filteredApps = bypassApps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.executable.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'browser':
        return <Globe className="w-4 h-4 text-emerald-400" />;
      case 'messenger':
        return <MessageSquare className="w-4 h-4 text-sky-400" />;
      case 'game':
        return <Gamepad2 className="w-4 h-4 text-indigo-400" />;
      case 'development':
        return <Code className="w-4 h-4 text-amber-400" />;
      default:
        return <Laptop className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header section with top actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Split className="w-5 h-5 text-indigo-400" />
            {t.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t.subtitle}
          </p>
        </div>

        <button
          type="button"
          id="add-app-bypass-btn"
          onClick={onOpenAddModal}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addAppBtn}</span>
        </button>
      </div>

      {/* Mode Switcher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Blacklist Mode */}
        <button
          type="button"
          onClick={() => onBypassModeChange('blacklist')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
            bypassMode === 'blacklist'
              ? 'bg-slate-900 border-indigo-500/60 shadow-indigo-950/40 shadow-lg ring-1 ring-indigo-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>{t.blacklistTitle}</span>
            </div>
            {bypassMode === 'blacklist' && (
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 ring-4 ring-indigo-400/20" />
            )}
          </div>
          <p className="text-xs text-slate-400">{t.blacklistDesc}</p>
        </button>

        {/* Whitelist Mode */}
        <button
          type="button"
          onClick={() => onBypassModeChange('whitelist')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden ${
            bypassMode === 'whitelist'
              ? 'bg-slate-900 border-indigo-500/60 shadow-indigo-950/40 shadow-lg ring-1 ring-indigo-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 opacity-80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>{t.whitelistTitle}</span>
            </div>
            {bypassMode === 'whitelist' && (
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-4 ring-sky-400/20" />
            )}
          </div>
          <p className="text-xs text-slate-400">{t.whitelistDesc}</p>
        </button>
      </div>

      {/* Applications List Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Search & Counter toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="search-bypass-apps-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-hidden text-slate-100 text-xs placeholder-slate-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-medium">
            {t.appCount
              .replace('{active}', activeCount.toString())
              .replace('{total}', bypassApps.length.toString())}
          </div>
        </div>

        {/* Apps List */}
        {filteredApps.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            {t.emptyList}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition ${
                  app.enabled
                    ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3.5 truncate">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    {getCategoryIcon(app.category)}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-xs truncate">
                        {app.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-indigo-300 font-mono border border-slate-700">
                        {app.executable}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                      {app.path}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Status Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={app.enabled}
                      onChange={() => onToggleApp(app.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => onDeleteApp(app.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                    title={language === 'ru' ? 'Удалить из списка' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3 text-xs text-indigo-300">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">
            {language === 'ru' ? 'Как работает Split Tunneling:' : 'How Split Tunneling Works:'}
          </span>{' '}
          {language === 'ru'
            ? 'Приложение перехватывает системные вызовы Windows Filtering Platform (WFP). Когда Google Chrome или другой процесс из списка отправляет сетевой пакет, драйвер автоматически перенаправляет его на ваш стандартный физический шлюз, а весь остальной трафик Windows идет через Wintun TUN туннель.'
            : 'The application uses the Windows Filtering Platform (WFP) to inspect process sockets. When Google Chrome or another listed executable creates an outbound connection, traffic is forwarded directly to your physical network gateway, bypassing the Wintun adapter.'}
        </div>
      </div>
    </div>
  );
};
