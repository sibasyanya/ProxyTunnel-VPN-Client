import React, { useState } from 'react';
import {
  X,
  Search,
  Plus,
  RefreshCw,
  FolderOpen,
  Laptop,
  CheckCircle,
  AlertCircle,
  Globe,
  MessageSquare,
  Gamepad2,
  Code,
  Music,
  Video,
  Shield,
  Cpu,
} from 'lucide-react';
import { BypassApp, AppLanguage } from '../types';
import { sampleRunningProcesses } from '../data/initialData';
import { translations } from '../translations';

interface AddAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddApp: (app: Omit<BypassApp, 'id'>) => void;
  existingApps: BypassApp[];
  language: AppLanguage;
}

export const AddAppModal: React.FC<AddAppModalProps> = ({
  isOpen,
  onClose,
  onAddApp,
  existingApps,
  language,
}) => {
  const t = translations[language].splitTunnel.modal;

  const [activeTab, setActiveTab] = useState<'running' | 'custom'>('running');
  const [searchQuery, setSearchQuery] = useState('');
  const [customPath, setCustomPath] = useState('');
  const [customName, setCustomName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAlreadyAdded = (executable: string) => {
    return existingApps.some(
      (a) => a.executable.toLowerCase() === executable.toLowerCase()
    );
  };

  const getProcessIcon = (category: string) => {
    switch (category) {
      case 'browser':
        return <Globe className="w-4 h-4 text-emerald-400" />;
      case 'messenger':
        return <MessageSquare className="w-4 h-4 text-sky-400" />;
      case 'game':
        return <Gamepad2 className="w-4 h-4 text-indigo-400" />;
      case 'development':
        return <Code className="w-4 h-4 text-amber-400" />;
      case 'system':
        return <Cpu className="w-4 h-4 text-slate-400" />;
      default:
        return <Laptop className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredProcesses = sampleRunningProcesses.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.executable.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProcess = (proc: typeof sampleRunningProcesses[0]) => {
    if (isAlreadyAdded(proc.executable)) {
      setErrorMessage(t.alreadyAdded);
      return;
    }

    onAddApp({
      name: proc.name,
      executable: proc.executable,
      path: proc.path,
      iconName: proc.iconName,
      enabled: true,
      category: proc.category,
      description: 'Auto-added from active processes',
    });

    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPath.trim()) return;

    let execName = customPath.trim();
    if (execName.includes('\\')) {
      execName = execName.split('\\').pop() || execName;
    }
    if (!execName.toLowerCase().endsWith('.exe')) {
      execName = `${execName}.exe`;
    }

    if (isAlreadyAdded(execName)) {
      setErrorMessage(t.alreadyAdded);
      return;
    }

    const displayName = customName.trim() || execName.replace(/\.exe$/i, '');

    onAddApp({
      name: displayName,
      executable: execName,
      path: customPath.trim(),
      iconName: 'laptop',
      enabled: true,
      category: 'custom',
      description: 'Manual file addition',
    });

    onClose();
  };

  const handleBrowseSimulated = () => {
    setCustomPath('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
    setCustomName('Google Chrome');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Laptop className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-base text-slate-100">{t.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 shrink-0">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              id="tab-running-processes"
              onClick={() => {
                setActiveTab('running');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                activeTab === 'running'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.tabRunning}</span>
            </button>

            <button
              type="button"
              id="tab-custom-exe"
              onClick={() => {
                setActiveTab('custom');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                activeTab === 'custom'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{t.tabCustom}</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {activeTab === 'running' ? (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="search-running-processes-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.runningSearchPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-hidden text-slate-100 text-xs placeholder-slate-500"
                />
              </div>

              <div className="text-[11px] text-slate-400 font-medium">
                {t.selectPrompt}
              </div>

              {/* Running Processes List */}
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {filteredProcesses.map((proc, index) => {
                  const added = isAlreadyAdded(proc.executable);

                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={added}
                      onClick={() => handleAddProcess(proc)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                        added
                          ? 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                          : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          {getProcessIcon(proc.category)}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-100 text-xs truncate">
                            {proc.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {proc.executable} • {proc.path}
                          </div>
                        </div>
                      </div>

                      {added ? (
                        <span className="text-[10px] text-slate-500 font-semibold px-2 py-1 bg-slate-800/60 rounded">
                          {language === 'ru' ? 'В списке' : 'Added'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1 hover:text-indigo-300">
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'ru' ? 'Добавить' : 'Add'}</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {t.customPathLabel} <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    placeholder={t.customPathPlaceholder}
                    className="flex-1 px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-hidden text-slate-100 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleBrowseSimulated}
                    className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition"
                  >
                    {t.browseBtn}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">
                  {t.appNameLabel}
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t.appNamePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-hidden text-slate-100 text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300">
                  {language === 'ru' ? 'Примеры исключений:' : 'Common Examples:'}
                </span>
                <p>• <code className="text-emerald-400">chrome.exe</code> — {language === 'ru' ? 'Браузер Chrome напрямую' : 'Google Chrome directly'}</p>
                <p>• <code className="text-emerald-400">steam.exe</code> — {language === 'ru' ? 'Игровой клиент Steam' : 'Steam game launcher'}</p>
                <p>• <code className="text-emerald-400">msedge.exe</code> — {language === 'ru' ? 'Microsoft Edge' : 'Edge Browser'}</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shadow-xs"
                >
                  {t.addBtn}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
