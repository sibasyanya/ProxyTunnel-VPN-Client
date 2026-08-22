import React, { useState } from 'react';
import {
  Power,
  Server,
  ArrowDown,
  ArrowUp,
  Clock,
  Zap,
  Globe2,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Laptop,
} from 'lucide-react';
import { ConnectionState, ProxyProfile, NetworkStats, AppLanguage, BypassApp, BypassMode } from '../types';
import { translations } from '../translations';
import { formatSpeed, formatBytes, formatSeconds, getCountryFlag } from '../utils/formatters';

interface DashboardViewProps {
  connectionState: ConnectionState;
  onToggleConnection: () => void;
  activeProxy: ProxyProfile | null;
  proxies: ProxyProfile[];
  onSelectProxy: (proxy: ProxyProfile) => void;
  networkStats: NetworkStats;
  language: AppLanguage;
  bypassApps: BypassApp[];
  bypassMode: BypassMode;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  connectionState,
  onToggleConnection,
  activeProxy,
  proxies,
  onSelectProxy,
  networkStats,
  language,
  bypassApps,
  bypassMode,
  onNavigateToTab,
}) => {
  const t = translations[language];
  const [showServerPicker, setShowServerPicker] = useState(false);

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';
  const activeBypassCount = bypassApps.filter((a) => a.enabled).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Top Banner / Main Connect Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Main Connect Action Card */}
        <div className="lg:col-span-7 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-xl">
          {/* Subtle Ambient Background glow */}
          <div
            className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
              isConnected
                ? 'bg-emerald-500/15'
                : isConnecting
                ? 'bg-amber-500/15'
                : 'bg-slate-700/10'
            }`}
          />

          {/* Header inside card */}
          <div className="flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {isConnected ? t.status.secure : t.status.direct}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isConnected
                  ? `${activeProxy?.protocol.toUpperCase()} • ${t.dashboard.networkInfo.routingStatus}`
                  : t.dashboard.networkInfo.directMode}
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isConnecting
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? 'bg-emerald-400 animate-pulse'
                    : isConnecting
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-slate-400'
                }`}
              />
              {isConnected
                ? t.status.connected
                : isConnecting
                ? t.status.connecting
                : t.status.disconnected}
            </span>
          </div>

          {/* Center Connect Button */}
          <div className="py-8 flex flex-col items-center justify-center z-10">
            <div className="relative flex items-center justify-center">
              {/* Animated pulsating circles when connected */}
              {isConnected && (
                <div className="absolute inset-0 -m-4 rounded-full bg-emerald-500/15 animate-ping" />
              )}
              {isConnected && (
                <div className="absolute inset-0 -m-2 rounded-full bg-emerald-500/20" />
              )}

              <button
                type="button"
                id="main-tunnel-toggle-btn"
                onClick={onToggleConnection}
                disabled={isConnecting || (!activeProxy && !isConnected)}
                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform active:scale-95 shadow-2xl relative z-10 ${
                  isConnected
                    ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-emerald-900/40 ring-4 ring-emerald-500/30'
                    : isConnecting
                    ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-amber-900/30 cursor-wait'
                    : !activeProxy
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-75'
                    : 'bg-gradient-to-b from-slate-800 to-slate-850 hover:from-slate-750 hover:to-slate-800 text-emerald-400 border-2 border-emerald-500/40 shadow-slate-950/60 hover:border-emerald-400'
                }`}
              >
                <Power
                  className={`w-12 h-12 transition-transform duration-300 ${
                    isConnected ? 'scale-110 text-white' : 'text-emerald-400'
                  }`}
                />
                <span className="text-[11px] font-bold tracking-wider mt-2 uppercase">
                  {isConnected
                    ? t.dashboard.btnDisconnect
                    : isConnecting
                    ? t.dashboard.btnConnecting
                    : t.dashboard.btnConnect}
                </span>
              </button>
            </div>

            {!activeProxy && !isConnected && (
              <p className="text-xs text-amber-400/90 mt-4 text-center flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {t.dashboard.selectProxyPrompt}
              </p>
            )}
          </div>

          {/* Bottom Card: Active Proxy Quick Selector */}
          <div className="z-10 bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                {activeProxy ? getCountryFlag(activeProxy.countryCode) : '🌐'}
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {t.dashboard.activeProxy}
                </div>
                <div className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <span>{activeProxy ? activeProxy.name : t.dashboard.noProxies}</span>
                  {activeProxy && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] uppercase font-mono text-emerald-400 border border-slate-700">
                      {activeProxy.protocol}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                id="switch-proxy-dropdown-btn"
                onClick={() => setShowServerPicker(!showServerPicker)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition"
              >
                <span>{t.dashboard.changeProxy}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showServerPicker && (
                <div className="absolute right-0 bottom-full mb-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 space-y-1">
                  <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    {language === 'ru' ? 'Выберите сервер' : 'Select Server'}
                  </div>
                  {proxies.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelectProxy(p);
                        setShowServerPicker(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition ${
                        activeProxy?.id === p.id
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-left truncate">
                        <span>{getCountryFlag(p.countryCode)}</span>
                        <div className="truncate">
                          <div className="font-medium truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {p.host}:{p.port} • {p.protocol.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 ml-2">
                        {p.ping ? `${p.ping}ms` : '--'}
                      </span>
                    </button>
                  ))}
                  <div className="pt-1 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowServerPicker(false);
                        onNavigateToTab('proxies');
                      }}
                      className="w-full py-1.5 text-center text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      + {language === 'ru' ? 'Управление прокси' : 'Manage Proxies'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Speed & Live Diagnostics */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          {/* Live Speed & Latency Metrics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>{language === 'ru' ? 'Сетевой монитор' : 'Network Telemetry'}</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                LIVE
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Download Metric */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.dashboard.speed.download}</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-100">
                  {isConnected ? formatSpeed(networkStats.downloadSpeed) : '0 KB/s'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  {t.dashboard.speed.totalIn}: {formatBytes(networkStats.totalDownloaded)}
                </div>
              </div>

              {/* Upload Metric */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
                  <span>{t.dashboard.speed.upload}</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-100">
                  {isConnected ? formatSpeed(networkStats.uploadSpeed) : '0 KB/s'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  {t.dashboard.speed.totalOut}: {formatBytes(networkStats.totalUploaded)}
                </div>
              </div>

              {/* Latency / Ping */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.dashboard.speed.latency}</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-100">
                  {isConnected && activeProxy?.ping ? `${activeProxy.ping} ms` : '12 ms'}
                </div>
                <div className="text-[10px] text-emerald-400 font-medium mt-1">
                  {isConnected ? 'TUN Fastpath' : 'Direct Link'}
                </div>
              </div>

              {/* Session Duration */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.dashboard.speed.uptime}</span>
                </div>
                <div className="text-xl font-bold font-mono text-slate-100">
                  {isConnected ? formatSeconds(networkStats.uptimeSeconds) : '00:00'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {isConnected ? 'Active Session' : 'Standby'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Split Tunneling Banner */}
          <div
            onClick={() => onNavigateToTab('bypass')}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 cursor-pointer transition flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  {bypassMode === 'blacklist'
                    ? (language === 'ru' ? 'Исключения приложений' : 'Split Tunneling (Bypass)')
                    : (language === 'ru' ? 'Туннелирование только выбранных' : 'Whitelist Mode')}
                </div>
                <div className="text-[11px] text-slate-400">
                  {activeBypassCount > 0
                    ? t.dashboard.quickBypassNotice.replace('{count}', activeBypassCount.toString())
                    : t.dashboard.quickBypassEmpty}
                </div>
              </div>
            </div>
            <span className="text-xs text-indigo-400 group-hover:translate-x-0.5 transition-transform">
              &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Network & Wintun Virtual Routing Details Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Outbound IP Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>{t.dashboard.networkInfo.publicIp}</span>
              <Globe2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-base font-bold font-mono text-slate-100 flex items-center gap-2">
              <span>{isConnected && activeProxy?.ip ? activeProxy.ip : networkStats.activeIp}</span>
              {isConnected && (
                <span className="text-emerald-400 text-xs">
                  {getCountryFlag(activeProxy?.countryCode)}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-1 truncate">
              {isConnected && activeProxy?.city
                ? `${activeProxy.city}, ${activeProxy.country}`
                : `${networkStats.activeCity}, ${networkStats.activeCountry}`}
            </div>
          </div>

          <a
            href="https://ip.ee"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-emerald-400 font-medium transition"
          >
            <span>{t.dashboard.networkInfo.checkIpBrowser || 'Проверить IP на ip.ee'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* DNS & Encryption Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>{t.dashboard.networkInfo.dns}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-bold font-mono text-slate-100">
            {isConnected ? '1.1.1.1 (Cloudflare DoH)' : networkStats.dnsServer}
          </div>
          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{isConnected ? 'DNS Leak Shield Active' : 'Standard Resolver'}</span>
          </div>
        </div>

        {/* Wintun Virtual Adapter Details */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>{t.dashboard.networkInfo.adapter}</span>
            <span className="text-[10px] text-slate-400 font-mono">MTU 1500</span>
          </div>
          <div className="text-base font-semibold text-slate-100 font-mono truncate">
            {isConnected ? 'Wintun Tunnel (10.8.0.2)' : 'Physical NIC (Direct)'}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {isConnected ? 'Driver: Wintun.sys (Layer 3)' : 'Default Gateway 192.168.1.1'}
          </div>
        </div>
      </div>
    </div>
  );
};
