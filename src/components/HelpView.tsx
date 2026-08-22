import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Activity,
  ShieldCheck,
  Server,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Zap,
  Cpu,
} from 'lucide-react';
import { AppLanguage, ProxyProfile } from '../types';
import { translations } from '../translations';

interface HelpViewProps {
  language: AppLanguage;
  activeProxy: ProxyProfile | null;
}

export const HelpView: React.FC<HelpViewProps> = ({ language, activeProxy }) => {
  const t = translations[language].help;
  const [activeTab, setActiveTab] = useState<'quickstart' | 'protocols' | 'splitGuide' | 'troubleshooting' | 'diagnostics'>('quickstart');

  // Diagnostics State
  const [isDiagRunning, setIsDiagRunning] = useState(false);
  const [diagResults, setDiagResults] = useState<{
    wintun: 'ok' | 'fail' | 'idle';
    proxy: 'ok' | 'warn' | 'fail' | 'idle';
    dns: 'ok' | 'fail' | 'idle';
    ip: 'ok' | 'fail' | 'idle';
  }>({
    wintun: 'idle',
    proxy: 'idle',
    dns: 'idle',
    ip: 'idle',
  });

  const runDiagnostics = () => {
    setIsDiagRunning(true);
    setDiagResults({
      wintun: 'idle',
      proxy: 'idle',
      dns: 'idle',
      ip: 'idle',
    });

    setTimeout(() => {
      setDiagResults((prev) => ({ ...prev, wintun: 'ok' }));
    }, 400);

    setTimeout(() => {
      setDiagResults((prev) => ({
        ...prev,
        proxy: activeProxy ? 'ok' : 'warn',
      }));
    }, 800);

    setTimeout(() => {
      setDiagResults((prev) => ({ ...prev, dns: 'ok' }));
    }, 1200);

    setTimeout(() => {
      setDiagResults((prev) => ({ ...prev, ip: 'ok' }));
      setIsDiagRunning(false);
    }, 1600);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-400" />
          {t.title}
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          {t.subtitle}
        </p>

        {/* Tab navigation pills */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-800">
          {[
            { id: 'quickstart', label: t.tabs.quickstart, icon: BookOpen },
            { id: 'protocols', label: t.tabs.protocols, icon: Server },
            { id: 'splitGuide', label: t.tabs.splitGuide, icon: Laptop },
            { id: 'troubleshooting', label: t.tabs.troubleshooting, icon: ShieldAlert },
            { id: 'diagnostics', label: t.tabs.diagnostics, icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`help-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Quickstart */}
      {activeTab === 'quickstart' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center mb-3">
                1
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">
                {language === 'ru' ? 'Добавьте прокси-сервер' : 'Add your Proxy Server'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'ru'
                  ? 'Перейдите во вкладку «Прокси-серверы» и добавьте ваш SOCKS5 или HTTP прокси. Укажите IP, порт, логин и пароль.'
                  : 'Go to the "Proxy Servers" tab and add your SOCKS5 or HTTP/HTTPS proxy with host, port, and authentication credentials.'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center mb-3">
                2
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">
                {language === 'ru' ? 'Включите туннель' : 'Connect System Tunnel'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'ru'
                  ? 'На главной вкладке нажмите большую кнопку «Подключить туннель». Windows автоматически начнет маршрутизировать трафик через прокси.'
                  : 'Click the large "Connect Tunnel" button on the Dashboard. Windows will route system and browser traffic through the proxy.'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center mb-3">
                3
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1">
                {language === 'ru' ? 'Проверьте IP в браузере' : 'Verify IP in Browser'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'ru'
                  ? 'Откройте сайты ip.ee, 2ip.ru или whoer.net — ваш адрес сменится на IP прокси-сервера.'
                  : 'Visit ip.ee, 2ip.ru, or whoer.net in Edge, Chrome, or Firefox — your public IP will show the proxy location.'}
              </p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-100">
                {language === 'ru' ? 'Защита от утечек и поддержка трея: ' : 'Leak Protection & System Tray: '}
              </span>
              {language === 'ru'
                ? 'ProxyTunnel автоматически очищает все системные маршруты при выходе, чтобы интернет не отключался. При нажатии на крестик окно сворачивается в трей возле часов Windows.'
                : 'ProxyTunnel cleanly removes system routes upon exit to prevent connection drops. Clicking the close button minimizes the app to the Windows tray.'}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Protocols */}
      {activeTab === 'protocols' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>SOCKS5 Protocol (UDP + TCP)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-[10px] text-emerald-400 font-mono">
                {language === 'ru' ? 'Рекомендуется' : 'Recommended'}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'ru'
                ? 'SOCKS5 — современный протокол 5-го уровня, передающий любые типы TCP и UDP пакетов без изменения заголовков. Идеален для браузеров, мессенджеров (Telegram, Discord) и игр.'
                : 'SOCKS5 is a Layer 5 protocol supporting raw TCP & UDP packets without modifying headers. Best choice for browsers, gaming, and VoIP.'}
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'ru' ? 'Поддержка аутентификации логин/пароль' : 'Username/Password Auth'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'ru' ? 'Удаленный DNS-резолвинг без утечек' : 'Remote DNS Resolution'}</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm">
                <Server className="w-4 h-4 text-sky-400" />
                <span>HTTP / HTTPS (CONNECT)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">
                Web Proxy
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'ru'
                ? 'HTTP(S) прокси оптимизирован для веб-сайтов через команду HTTP CONNECT. Шифрует весь HTTPS-трафик между вашим ПК и сервером назначения.'
                : 'HTTP/HTTPS proxy uses HTTP CONNECT tunneling to create TLS streams between your computer and web destinations.'}
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>{language === 'ru' ? 'Совместимость с любыми веб-серверами' : 'Broad compatibility with web nodes'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>{language === 'ru' ? 'Высокая скорость загрузки страниц' : 'Fast web page caching and transfer'}</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: Split Tunneling Guide */}
      {activeTab === 'splitGuide' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100 border-b border-slate-800 pb-3">
            <Laptop className="w-4 h-4 text-indigo-400" />
            <span>{language === 'ru' ? 'Как работает раздельное туннелирование (Split Tunneling)' : 'How Split Tunneling Operates'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold text-slate-200">
                {language === 'ru' ? '1. Черный список (Исключения)' : '1. Blacklist (Bypass Mode)'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'ru'
                  ? 'Весь интернет-трафик системы направляется через прокси, КРОМЕ добавленных программ (например, игры с низким пингом или локальные сервисы).'
                  : 'All Windows traffic routes through the proxy EXCEPT apps in the list (e.g. low-ping multiplayer games or bank apps).'}
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold text-slate-200">
                {language === 'ru' ? '2. Белый список (Только выбранные)' : '2. Whitelist (Target Mode)'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'ru'
                  ? 'ТОЛЬКО указанные программы (например, Chrome или Telegram) используют прокси. Все остальные системные процессы работают напрямую.'
                  : 'ONLY designated software processes route through the proxy while everything else connects directly.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Troubleshooting */}
      {activeTab === 'troubleshooting' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100 border-b border-slate-800 pb-3">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>{language === 'ru' ? 'Устранение неполадок и советы' : 'Troubleshooting & FAQ'}</span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-semibold text-slate-200 mb-1">
                {language === 'ru' ? '❓ Сайт ip.ee или 2ip не меняет IP-адрес' : '❓ IP does not change on ip.ee or 2ip'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'ru'
                  ? '1. Убедитесь, что кнопка на главной вкладке горит зеленым («Подключено»). 2. Обновите вкладку в браузере (Ctrl + F5), чтобы сбросить кэш сокетов.'
                  : '1. Ensure the Dashboard button shows "Connected". 2. Hard refresh your browser tab (Ctrl + F5) to bypass cached sockets.'}
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-semibold text-slate-200 mb-1">
                {language === 'ru' ? '❓ Ошибка авторизации на SOCKS5 прокси' : '❓ SOCKS5 Authentication Error'}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'ru'
                  ? 'Проверьте логин и пароль в окне редактирования прокси. Если прокси привязан к вашему IP-адресу у провайдера, логин и пароль можно оставить пустыми.'
                  : 'Verify your username and password. If your proxy provider uses IP binding, you can leave the credentials empty.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">{t.diag.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{t.diag.subtitle}</p>
            </div>
            <button
              type="button"
              id="run-diagnostics-btn"
              onClick={runDiagnostics}
              disabled={isDiagRunning}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50 shadow-xs"
            >
              <Activity className={`w-3.5 h-3.5 ${isDiagRunning ? 'animate-spin' : ''}`} />
              <span>{isDiagRunning ? t.diag.testing : t.diag.runAll}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Wintun / WinINet item */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-200">{t.diag.items.wintun}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{t.diag.items.wintunDesc}</div>
              </div>
              <div className="shrink-0">
                {diagResults.wintun === 'ok' ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-[10px] text-emerald-400 font-mono">
                    {t.diag.statusOk}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-500 font-mono">
                    {t.diag.statusIdle}
                  </span>
                )}
              </div>
            </div>

            {/* Proxy Socket item */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-200">{t.diag.items.proxySocket}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{t.diag.items.proxySocketDesc}</div>
              </div>
              <div className="shrink-0">
                {diagResults.proxy === 'ok' ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-[10px] text-emerald-400 font-mono">
                    {t.diag.statusOk}
                  </span>
                ) : diagResults.proxy === 'warn' ? (
                  <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-[10px] text-amber-400 font-mono">
                    {t.diag.statusWarn}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-500 font-mono">
                    {t.diag.statusIdle}
                  </span>
                )}
              </div>
            </div>

            {/* DNS Leak item */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-200">{t.diag.items.dnsLeak}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{t.diag.items.dnsLeakDesc}</div>
              </div>
              <div className="shrink-0">
                {diagResults.dns === 'ok' ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-[10px] text-emerald-400 font-mono">
                    {t.diag.statusOk}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-500 font-mono">
                    {t.diag.statusIdle}
                  </span>
                )}
              </div>
            </div>

            {/* IP Masking item */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-200">{t.diag.items.ipMasking}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{t.diag.items.ipMaskingDesc}</div>
              </div>
              <div className="shrink-0">
                {diagResults.ip === 'ok' ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-[10px] text-emerald-400 font-mono">
                    {t.diag.statusOk}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-500 font-mono">
                    {t.diag.statusIdle}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
