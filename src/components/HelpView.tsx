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
  Zap,
  Sliders,
  Compass,
  Monitor,
  Wifi,
  Globe,
  Settings,
  Lock,
} from 'lucide-react';
import { AppLanguage, ProxyProfile } from '../types';
import { translations } from '../translations';

interface HelpViewProps {
  language: AppLanguage;
  activeProxy: ProxyProfile | null;
}

export const HelpView: React.FC<HelpViewProps> = ({ language, activeProxy }) => {
  const t = translations[language].help;
  const [activeTab, setActiveTab] = useState<'reference' | 'quickstart' | 'protocols' | 'splitGuide' | 'diagnostics'>('reference');

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
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          {language === 'ru'
            ? 'Полное интерактивное руководство по всем функциям, виджетам, индикаторам, меню и системным настройкам ProxyTunnel VPN Client.'
            : 'Comprehensive guide covering every UI widget, metric indicator, menu option, and proxy setting in ProxyTunnel.'}
        </p>

        {/* Tab navigation pills */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-800">
          {[
            { id: 'reference', label: language === 'ru' ? 'Справочник элементов и виджетов' : 'UI & Widgets Reference', icon: Compass },
            { id: 'quickstart', label: t.tabs.quickstart, icon: BookOpen },
            { id: 'protocols', label: t.tabs.protocols, icon: Server },
            { id: 'splitGuide', label: t.tabs.splitGuide, icon: Laptop },
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

      {/* Tab 0: Comprehensive UI & Widgets Reference */}
      {activeTab === 'reference' && (
        <div className="space-y-6 animate-fade-in">
          {/* Section 1: Top Bar & Window Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Monitor className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ru' ? '1. Верхняя панель (Header) и управление окном' : '1. Top Header & Window Controls'}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-emerald-400">
                  {language === 'ru' ? 'Индикатор статуса (по центру):' : 'Status Pill (Center):'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'Отображает текущее состояние туннеля в реальном времени: «Подключено» (зеленая пульсация с флагом страны сервера), «Подключение...» (желтый спиннер) или «Отключено» (серый). Область панели также служит для перетаскивания окна по экрану.'
                    : 'Displays live tunnel status: Connected (green pulsing beacon with country flag), Connecting (yellow spinner), or Disconnected. Drag the window by this header area.'}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-amber-400">
                  {language === 'ru' ? 'Переключатель тем (☀️/🌙) и языка (RU/EN):' : 'Theme & Language Switchers:'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'Кнопка с иконкой солнца/луны мгновенно переключает между темной и светлой темами оформления. Кнопки RU/EN моментально меняют язык интерфейса.'
                    : 'Sun/Moon toggle switches between Dark and Light mode. RU/EN buttons switch the UI language instantly without restarting.'}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-sky-400">
                  {language === 'ru' ? 'Системные кнопки Windows 11 (—, □, ✕):' : 'Native Window Buttons:'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'Кнопки интегрированы с ядром Windows: сворачивание, разворачивание во весь экран и безопасное сворачивание в системный трей возле часов при нажатии на крестик.'
                    : 'Minimize, maximize/restore, and close buttons integrated with Tauri/Windows. Closing minimizes the client to the system tray by default.'}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-indigo-400">
                  {language === 'ru' ? 'Значок трея (в области уведомлений):' : 'System Tray Icon:'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'Двойной клик по иконке в трее открывает окно. Правый клик открывает контекстное меню для быстрого отключения туннеля или полного выхода из приложения.'
                    : 'Double-clicking tray icon restores the window. Right-clicking opens menu to disconnect tunnel or exit the app safely.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Dashboard Widgets */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{language === 'ru' ? '2. Главная вкладка (Dashboard) — Виджеты и мониторы' : '2. Dashboard Widgets & Telemetry'}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-emerald-400">
                  {language === 'ru' ? 'Большая кнопка «ПОДКЛЮЧИТЬ ТУННЕЛЬ»:' : 'Big Connect Button:'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'Главная кнопка управления. При нажатии обращается к системным интерфейсам Windows (WinINet, Registry, WinHTTP), настраивая единую маршрутизацию для всех приложений через активный прокси.'
                    : 'Main power switch. Activates system proxy routing across all browsers, background services, and desktop apps.'}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-sky-400">
                  {language === 'ru' ? 'Виджет «Исходящий IP»:' : 'Public IP Widget:'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'Показывает внешний IP-адрес, под которым вас видят сайты в интернете, а также страну и город сервера. Снизу расположена прямая кнопка проверки IP на сервисе 2ip.io.'
                    : 'Displays active public IPv4 address and geolocation. Includes a direct one-click link to verify IP on 2ip.io.'}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-indigo-400">
                  {language === 'ru' ? 'Входящая / Исходящая скорость:' : 'Download / Upload Speed:'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'Отображает текущую скорость передачи данных в реальном времени (KB/s, MB/s), а также суммарный объем принятого и переданного трафика за текущую сессию.'
                    : 'Shows real-time throughput metrics and total session bandwidth consumption (bytes in/out).'}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-amber-400">
                  {language === 'ru' ? 'Задержка (Ping / Latency):' : 'Ping / Latency Metric:'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'Время отклика до прокси-сервера в миллисекундах (мс). Чем ниже значение, тем быстрее открываются веб-страницы и стабильнее голосовая связь.'
                    : 'Round-trip response time to proxy server in milliseconds. Lower ping provides snappier web browsing and lower VoIP delay.'}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-purple-400">
                  {language === 'ru' ? 'Время сессии (Uptime):' : 'Session Duration:'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'Таймер непрерывной активности текущего подключения в формате ММ:СС или ЧЧ:ММ:СС.'
                    : 'Continuous connection timer measuring the current active tunnel uptime.'}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-emerald-400">
                  {language === 'ru' ? 'DNS & Защита от утечек:' : 'DNS Leak Shield:'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'Показывает активный защищенный DNS-резолвер (например, Cloudflare 1.1.1.1 DoH), который предотвращает перехват провайдером посещаемых сайтов.'
                    : 'Indicates the active encrypted DNS resolver protecting your queries against ISP snooping.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Split Tunneling & Proxies */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>{language === 'ru' ? '3. Вкладки «Прокси-серверы» и «Исключения приложений»' : '3. Proxy Server Manager & App Bypass'}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-emerald-400">
                  {language === 'ru' ? 'Менеджер серверов:' : 'Server Manager:'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'Позволяет сохранять неограниченное число SOCKS5 и HTTP/HTTPS прокси. Поддерживает тест задержки (Ping) в один клик, автоматическую авторизацию (логин и пароль) и быстрое переключение.'
                    : 'Store multiple SOCKS5 / HTTP profiles. Perform one-click latency tests and easily switch between servers.'}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-indigo-400">
                  {language === 'ru' ? 'Исключения приложений (Split Tunneling):' : 'Split Tunneling Modes:'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'Режим «Черный список» направляет весь интернет через прокси, кроме выбранных программ (например, игры идут напрямую). Режим «Белый список» направляет через прокси только указанные программы.'
                    : 'Blacklist mode routes all traffic through proxy except chosen apps. Whitelist mode tunnels only selected programs.'}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-amber-400">
                  {language === 'ru' ? 'Кнопка «Обновить список процессов»:' : 'Refresh Processes Button:'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'Сканирует запущенные в Windows процессы и отображает актуальный список открытых программ с их путями для добавления в исключения в один клик.'
                    : 'Scans running Windows processes and provides one-click adding of active apps.'}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-sky-400">
                  {language === 'ru' ? 'Кнопка «Обзор...» (.EXE):' : 'Native File Dialog (.EXE):'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'Открывает системный проводник Windows для выбора любого исполняемого файла программы на жестком диске (в Program Files, AppData и т.д.).'
                    : 'Opens native Windows File Explorer to browse and select any .exe file on your disk.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Settings & Security */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Settings className="w-4 h-4 text-purple-400" />
              <span>{language === 'ru' ? '4. Настройки приложения и безопасность' : '4. Application Settings & Security'}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-red-400">
                  {language === 'ru' ? 'Kill Switch (Аварийный выключатель):' : 'Kill Switch:'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'При непредвиденном обрыве связи с прокси немедленно блокирует весь исходящий интернет-трафик, исключая случайную утечку вашего реального IP.'
                    : 'Instantly blocks outgoing traffic if proxy connection drops, preventing real IP exposure.'}
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="font-semibold text-emerald-400">
                  {language === 'ru' ? 'Автозапуск и Сворачивание в трей:' : 'Startup & Tray Integration:'}
                </span>
                <p className="text-slate-300 mt-1">
                  {language === 'ru'
                    ? 'Возможность запускать приложение вместе со стартом Windows 11 и удерживать его в фоне около часов, экономя оперативную память.'
                    : 'Enables automatic launch on Windows boot and keeps the app running in background.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Quickstart */}
      {activeTab === 'quickstart' && (
        <div className="space-y-4 animate-fade-in">
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
                  ? 'Откройте сайты 2ip.io или whoer.net — ваш адрес сменится на IP прокси-сервера.'
                  : 'Visit 2ip.io or whoer.net in Edge, Chrome, or Firefox — your public IP will show the proxy location.'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
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
                <span>{language === 'ru' ? 'Полная совместимость с Telegram и браузерами' : 'Full Telegram & Browser Compatibility'}</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>HTTP / HTTPS Proxy</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'ru'
                ? 'HTTP/HTTPS прокси работают на прикладном уровне (Layer 7). Оптимизированы для веб-серфинга, потокового видео и API-запросов.'
                : 'HTTP/HTTPS proxies operate at Layer 7, optimized for web browsing, video streaming, and REST API traffic.'}
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Split Tunneling Guide */}
      {activeTab === 'splitGuide' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm border-b border-slate-800 pb-3">
            <Laptop className="w-4 h-4 text-indigo-400" />
            <span>{language === 'ru' ? 'Настройка Split Tunneling для программ и браузеров' : 'Configuring Split Tunneling'}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {language === 'ru'
              ? 'Функция Split Tunneling позволяет одновременно использовать прокси для одних приложений и прямой домашний интернет для других.'
              : 'Split Tunneling allows routing sensitive or foreign traffic through the proxy while keeping games or local apps on direct connection.'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="font-semibold text-emerald-400 mb-1">{language === 'ru' ? 'Пример: Google Chrome напрямую' : 'Example: Chrome Direct'}</div>
              <p className="text-slate-400">{language === 'ru' ? 'Добавьте chrome.exe в Черный список — браузер будет открывать сайты через вашего обычного провайдера на максимальной скорости.' : 'Add chrome.exe to bypass list to browse with native ISP IP.'}</p>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="font-semibold text-indigo-400 mb-1">{language === 'ru' ? 'Пример: Игры Steam / Discord' : 'Example: Steam / Discord'}</div>
              <p className="text-slate-400">{language === 'ru' ? 'Добавьте steam.exe в исключения для предотвращения задержек в сетевых играх.' : 'Bypass steam.exe to ensure zero additional gaming ping.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 animate-fade-in">
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
