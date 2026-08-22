import React from 'react';
import { Activity, Server, Split, HelpCircle, Settings } from 'lucide-react';
import { ActiveTab, AppLanguage } from '../types';
import { translations } from '../translations';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  language: AppLanguage;
  proxiesCount: number;
  bypassCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  language,
  proxiesCount,
  bypassCount,
}) => {
  const t = translations[language];

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: t.nav.dashboard,
      icon: Activity,
      badge: null,
    },
    {
      id: 'proxies' as ActiveTab,
      label: t.nav.proxies,
      icon: Server,
      badge: proxiesCount > 0 ? proxiesCount.toString() : null,
    },
    {
      id: 'bypass' as ActiveTab,
      label: t.nav.splitTunnel,
      icon: Split,
      badge: bypassCount > 0 ? bypassCount.toString() : null,
    },
    {
      id: 'help' as ActiveTab,
      label: t.nav.help,
      icon: HelpCircle,
      badge: null,
    },
    {
      id: 'settings' as ActiveTab,
      label: t.nav.settings,
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between p-3 select-none">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {language === 'ru' ? 'Навигация' : 'Navigation'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    isActive
                      ? 'bg-emerald-500/30 text-emerald-200'
                      : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / System Status card */}
      <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center justify-between font-medium text-slate-300">
          <span>Windows 11 Driver</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Wintun.sys
          </span>
        </div>
        <div className="text-[10px] text-slate-400 truncate">
          {language === 'ru' ? 'Ядро маршрутизации готово' : 'Layer 3 Engine Ready'}
        </div>
      </div>
    </aside>
  );
};
