import React, { useState } from 'react';
import {
  Plus,
  Server,
  Zap,
  Trash2,
  Edit2,
  Check,
  CheckCircle2,
  Download,
  Upload,
  Lock,
  Globe,
  Radio,
} from 'lucide-react';
import { ProxyProfile, AppLanguage } from '../types';
import { translations } from '../translations';
import { getCountryFlag } from '../utils/formatters';

interface ProxiesViewProps {
  proxies: ProxyProfile[];
  activeProxyId: string | null;
  onSelectActiveProxy: (proxy: ProxyProfile) => void;
  onAddProxy: () => void;
  onEditProxy: (proxy: ProxyProfile) => void;
  onDeleteProxy: (id: string) => void;
  onTestAll: () => void;
  onTestSinglePing: (id: string) => void;
  language: AppLanguage;
}

export const ProxiesView: React.FC<ProxiesViewProps> = ({
  proxies,
  activeProxyId,
  onSelectActiveProxy,
  onAddProxy,
  onEditProxy,
  onDeleteProxy,
  onTestAll,
  onTestSinglePing,
  language,
}) => {
  const t = translations[language].proxies;
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleSinglePing = (id: string) => {
    setTestingId(id);
    onTestSinglePing(id);
    setTimeout(() => setTestingId(null), 600);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header section with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            {t.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            id="test-all-proxies-btn"
            onClick={onTestAll}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.testAllBtn}</span>
          </button>

          <button
            type="button"
            id="add-proxy-top-btn"
            onClick={onAddProxy}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addBtn}</span>
          </button>
        </div>
      </div>

      {/* Proxies List */}
      {proxies.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-4">
            <Server className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 mb-1">
            {t.emptyTitle}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6">
            {t.emptyDesc}
          </p>
          <button
            type="button"
            onClick={onAddProxy}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addBtn}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proxies.map((proxy) => {
            const isActive = proxy.id === activeProxyId;
            const isPinging = testingId === proxy.id;

            return (
              <div
                key={proxy.id}
                className={`bg-slate-900 rounded-2xl p-5 border transition-all relative overflow-hidden flex flex-col justify-between ${
                  isActive
                    ? 'border-emerald-500/50 shadow-emerald-950/30 shadow-lg ring-1 ring-emerald-500/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top status bar inside card */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-xs">
                        {getCountryFlag(proxy.countryCode)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-100 text-sm">
                            {proxy.name}
                          </h4>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold tracking-wide">
                              {t.activeBadge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-slate-950 text-[10px] font-bold text-slate-300 border border-slate-800 uppercase">
                            {proxy.protocol}
                          </span>
                          <span>
                            {proxy.host}:{proxy.port}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ping badge */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        id={`ping-btn-${proxy.id}`}
                        onClick={() => handleSinglePing(proxy.id)}
                        title={t.testPing}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 transition"
                      >
                        <Zap
                          className={`w-3 h-3 text-amber-400 ${
                            isPinging ? 'animate-spin' : ''
                          }`}
                        />
                        <span>{proxy.ping ? `${proxy.ping}ms` : '--'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Auth info & parameters */}
                  <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 mb-4 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>{t.auth}:</span>
                      <span className="font-mono text-slate-300 flex items-center gap-1">
                        {proxy.username ? (
                          <>
                            <Lock className="w-3 h-3 text-emerald-400" />
                            <span>{proxy.username}</span>
                          </>
                        ) : (
                          <span className="text-slate-400">
                            {language === 'ru' ? 'Без авторизации' : 'No Auth'}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>{language === 'ru' ? 'Статус ноды' : 'Node Status'}:</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                        {language === 'ru' ? 'Доступен' : 'Reachable'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id={`edit-proxy-${proxy.id}`}
                      onClick={() => onEditProxy(proxy)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition"
                      title={t.edit}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      id={`delete-proxy-${proxy.id}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            t.deleteConfirm.replace('{name}', proxy.name)
                          )
                        ) {
                          onDeleteProxy(proxy.id);
                        }
                      }}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition"
                      title={t.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!isActive ? (
                    <button
                      type="button"
                      id={`select-active-${proxy.id}`}
                      onClick={() => onSelectActiveProxy(proxy)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/80 hover:text-white border border-slate-700 text-xs font-medium text-slate-300 transition flex items-center gap-1.5"
                    >
                      <Radio className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.setAsActive}</span>
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 px-3 py-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'ru' ? 'Выбран для туннеля' : 'Tunnel Target'}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
