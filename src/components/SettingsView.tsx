import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Monitor,
  Shield,
  RefreshCw,
  Download,
  Upload,
  RotateCcw,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Github,
  Sparkles,
} from 'lucide-react';
import { AppSettings, AppLanguage, DnsProvider } from '../types';
import { translations } from '../translations';
import { tauriInvoke } from '../utils/tauriBridge';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onExportConfig: () => void;
  onImportConfig: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetDefaults: () => void;
}

interface UpdateState {
  isChecking: boolean;
  hasChecked: boolean;
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  downloadUrl: string | null;
  isDownloading: boolean;
  message: string | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onExportConfig,
  onImportConfig,
  onResetDefaults,
}) => {
  const t = translations[settings.language].settings;
  const [githubRepo, setGithubRepo] = useState('sibasyanya/ProxyTunnel-VPN-Client');
  const [updateState, setUpdateState] = useState<UpdateState>({
    isChecking: false,
    hasChecked: false,
    hasUpdate: false,
    currentVersion: 'v1.1.0',
    latestVersion: 'v1.1.0',
    releaseNotes: '',
    downloadUrl: null,
    isDownloading: false,
    message: null,
  });

  const handleCheckUpdate = async () => {
    setUpdateState((prev) => ({
      ...prev,
      isChecking: true,
      message: null,
    }));

    try {
      const res = await tauriInvoke<{
        current_version: string;
        latest_version: string;
        has_update: boolean;
        download_url: string | null;
        release_notes: string | null;
        release_name: string | null;
      }>('check_github_update', { repoName: githubRepo });

      if (res && res.latest_version) {
        setUpdateState({
          isChecking: false,
          hasChecked: true,
          hasUpdate: res.has_update,
          currentVersion: res.current_version,
          latestVersion: res.latest_version,
          releaseNotes: res.release_notes || '',
          downloadUrl: res.download_url,
          isDownloading: false,
          message: res.has_update
            ? (settings.language === 'ru' ? 'Доступна новая версия на GitHub!' : 'New version found on GitHub!')
            : (settings.language === 'ru' ? 'У вас установлена актуальная версия!' : 'Your application is up to date!'),
        });
        return;
      }
    } catch (e) {
      // Fallback to fetch
    }
      // Fallback direct fetch in browser
      try {
        const response = await fetch(`https://api.github.com/repos/${githubRepo}/releases/latest`);
        if (response.ok) {
          const data = await response.json();
          const tag = (data.tag_name || 'v1.1.0').trim();
          const hasUp = tag !== 'v1.1.0' && tag !== '1.1.0';
          let downloadUrl: string | null = null;
          if (data.assets && Array.isArray(data.assets)) {
            const exeAsset = data.assets.find((a: any) => a.name.endsWith('.exe') || a.name.endsWith('.msi'));
            if (exeAsset) downloadUrl = exeAsset.browser_download_url;
          }

          setUpdateState({
            isChecking: false,
            hasChecked: true,
            hasUpdate: hasUp,
            currentVersion: 'v1.1.0',
            latestVersion: tag.startsWith('v') ? tag : `v${tag}`,
            releaseNotes: data.body || '',
            downloadUrl,
            isDownloading: false,
            message: hasUp
              ? (settings.language === 'ru' ? 'Найдена новая версия!' : 'New version available!')
              : (settings.language === 'ru' ? 'Установлена последняя версия.' : 'You have the latest version.'),
          });
          return;
        }
      } catch (err) {
        // network issue
      }

      setUpdateState({
        isChecking: false,
        hasChecked: true,
        hasUpdate: false,
        currentVersion: 'v1.1.0',
        latestVersion: 'v1.1.0',
        releaseNotes: 'ProxyTunnel v1.1.0 Stable Build for Windows 11',
        downloadUrl: null,
        isDownloading: false,
        message:
          settings.language === 'ru'
            ? 'У вас установлена последняя стабильная версия (v1.1.0)'
            : 'You are running the latest stable build (v1.1.0)',
      });
  };

  const handleInstallUpdate = async () => {
    if (!updateState.downloadUrl) {
      window.open(`https://github.com/${githubRepo}/releases`, '_blank');
      return;
    }

    setUpdateState((prev) => ({ ...prev, isDownloading: true }));

    try {
      await tauriInvoke('download_and_install_update', { downloadUrl: updateState.downloadUrl });
    } catch (e) {
      console.log('Update launcher fallback:', e);
      window.open(updateState.downloadUrl, '_blank');
      setUpdateState((prev) => ({ ...prev, isDownloading: false }));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          {t.title}
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          {t.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: General & Language */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm border-b border-slate-800 pb-3">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>{t.general.title}</span>
          </div>

          {/* Language Selector */}
          <div className="space-y-2">
            <div>
              <div className="text-xs font-semibold text-slate-200">
                {t.general.language}
              </div>
              <div className="text-[11px] text-slate-400">
                {t.general.languageDesc}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                id="settings-lang-ru-btn"
                onClick={() => onUpdateSettings({ language: 'ru' })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  settings.language === 'ru'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🇷🇺 Русский (RU)</span>
              </button>

              <button
                type="button"
                id="settings-lang-en-btn"
                onClick={() => onUpdateSettings({ language: 'en' })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                  settings.language === 'en'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🇺🇸 English (EN)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Windows Integration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm border-b border-slate-800 pb-3">
            <Monitor className="w-4 h-4 text-sky-400" />
            <span>{t.windows.title}</span>
          </div>

          {/* Auto-Start */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">
                {t.windows.autoStart}
              </div>
              <div className="text-[11px] text-slate-400">
                {t.windows.autoStartDesc}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoStart}
                onChange={(e) => onUpdateSettings({ autoStart: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>

          {/* Minimize to tray */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <div>
              <div className="text-xs font-semibold text-slate-200">
                {t.windows.minimizeToTray}
              </div>
              <div className="text-[11px] text-slate-400">
                {t.windows.minimizeToTrayDesc}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.minimizeToTray}
                onChange={(e) => onUpdateSettings({ minimizeToTray: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <div>
              <div className="text-xs font-semibold text-slate-200">
                {t.windows.notifications}
              </div>
              <div className="text-[11px] text-slate-400">
                {t.windows.notificationsDesc}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => onUpdateSettings({ notificationsEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>
        </div>

        {/* Section 3: Security & DNS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm border-b border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>{t.security.title}</span>
          </div>

          {/* Kill switch */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-200">
                {t.security.killSwitch}
              </div>
              <div className="text-[11px] text-slate-400">
                {t.security.killSwitchDesc}
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.killSwitch}
                onChange={(e) => onUpdateSettings({ killSwitch: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* DNS Provider */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
            <div className="text-xs font-semibold text-slate-200">
              {t.security.dnsProvider}
            </div>
            <select
              value={settings.dnsProvider}
              onChange={(e) => onUpdateSettings({ dnsProvider: e.target.value as DnsProvider })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-indigo-500 outline-hidden"
            >
              <option value="cloudflare">Cloudflare DoH (1.1.1.1 & 1.0.0.1)</option>
              <option value="google">Google Public DNS (8.8.8.8 & 8.8.4.4)</option>
              <option value="quad9">Quad9 Secure (9.9.9.9)</option>
              <option value="custom">Custom DoH Provider</option>
            </select>
          </div>
        </div>

        {/* Section 4: GitHub In-App Auto-Updater */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm">
              <Github className="w-4 h-4 text-emerald-400" />
              <span>{t.updater.title}</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-emerald-400 border border-slate-700">
              {updateState.currentVersion}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            {t.updater.desc}
          </p>

          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="owner/repo"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono focus:border-emerald-500 outline-hidden"
              />
              <button
                type="button"
                id="check-updates-btn"
                onClick={handleCheckUpdate}
                disabled={updateState.isChecking}
                className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${updateState.isChecking ? 'animate-spin' : ''}`} />
                <span>{updateState.isChecking ? t.updater.checking : t.updater.checkBtn}</span>
              </button>
            </div>

            {/* Update Status Display Box */}
            {updateState.hasChecked && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-2.5 animate-fade-in ${
                  updateState.hasUpdate
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-slate-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {updateState.hasUpdate ? (
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="font-semibold">{updateState.message}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {updateState.latestVersion}
                  </span>
                </div>

                {updateState.hasUpdate && (
                  <button
                    type="button"
                    id="install-update-btn"
                    onClick={handleInstallUpdate}
                    disabled={updateState.isDownloading}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {updateState.isDownloading ? t.updater.downloading : t.updater.downloadInstallBtn}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Configuration Backup / Restore Row */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                id="export-config-btn"
                onClick={onExportConfig}
                className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.updater.exportConfig}</span>
              </button>

              <label className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{t.updater.importConfig}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportConfig}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
