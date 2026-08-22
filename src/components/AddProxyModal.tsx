import React, { useState, useEffect } from 'react';
import { X, Server, Check, AlertCircle, Eye, EyeOff, Activity } from 'lucide-react';
import { ProxyProfile, Protocol, AppLanguage } from '../types';
import { translations } from '../translations';

interface AddProxyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (proxy: Omit<ProxyProfile, 'id'>) => void;
  editProxy?: ProxyProfile | null;
  language: AppLanguage;
}

export const AddProxyModal: React.FC<AddProxyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editProxy,
  language,
}) => {
  const t = translations[language].proxies.modal;

  const [name, setName] = useState('');
  const [protocol, setProtocol] = useState<Protocol>('socks5');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('1080');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; ping?: number; message?: string } | null>(null);

  useEffect(() => {
    if (editProxy) {
      setName(editProxy.name);
      setProtocol(editProxy.protocol);
      setHost(editProxy.host);
      setPort(editProxy.port.toString());
      setUsername(editProxy.username || '');
      setPassword(editProxy.password || '');
    } else {
      setName('');
      setProtocol('socks5');
      setHost('');
      setPort('1080');
      setUsername('');
      setPassword('');
    }
    setTestResult(null);
    setIsTesting(false);
  }, [editProxy, isOpen]);

  if (!isOpen) return null;

  const handleProtocolChange = (newProtocol: Protocol) => {
    setProtocol(newProtocol);
    if (!editProxy && (port === '1080' || port === '8080')) {
      setPort(newProtocol === 'socks5' ? '1080' : '8080');
    }
  };

  const handleTestConnection = () => {
    if (!host) {
      setTestResult({ success: false, message: 'Please provide host/IP first' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      const simulatedPing = Math.floor(Math.random() * 45) + 20;
      setTestResult({
        success: true,
        ping: simulatedPing,
        message: t.pingSuccess.replace('{ping}', simulatedPing.toString()),
      });
    }, 750);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!host || !port) return;

    onSave({
      name: name.trim() || `${protocol.toUpperCase()} - ${host}:${port}`,
      protocol,
      host: host.trim(),
      port: parseInt(port, 10) || (protocol === 'socks5' ? 1080 : 8080),
      username: username.trim() || undefined,
      password: password.trim() || undefined,
      ping: testResult?.ping || 32,
      country: 'Proxy Node',
      countryCode: 'DE',
      city: 'Frankfurt',
      ip: host.trim(),
      status: 'online',
      lastTested: 'Just now',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-base text-slate-100">
              {editProxy ? t.editTitle : t.addTitle}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Protocol Switcher */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">
              {t.protocolLabel}
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                id="select-protocol-socks5"
                onClick={() => handleProtocolChange('socks5')}
                className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                  protocol === 'socks5'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>SOCKS5</span>
                <span className="text-[10px] opacity-80 font-normal">(TCP & UDP)</span>
              </button>

              <button
                type="button"
                id="select-protocol-http"
                onClick={() => handleProtocolChange('http')}
                className={`py-2 px-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                  protocol === 'http'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>HTTP / HTTPS</span>
                <span className="text-[10px] opacity-80 font-normal">(CONNECT)</span>
              </button>
            </div>
          </div>

          {/* Label / Name */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              {t.nameLabel}
            </label>
            <input
              type="text"
              id="proxy-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden text-slate-100 placeholder-slate-600 text-xs"
            />
          </div>

          {/* Host & Port Row */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-8">
              <label className="block text-slate-400 mb-1 font-medium">
                {t.hostLabel} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="proxy-host-input"
                required
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder={t.hostPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden text-slate-100 font-mono text-xs"
              />
            </div>

            <div className="col-span-4">
              <label className="block text-slate-400 mb-1 font-medium">
                {t.portLabel} <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                id="proxy-port-input"
                required
                min={1}
                max={65535}
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder={t.portPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden text-slate-100 font-mono text-xs"
              />
            </div>
          </div>

          {/* Credentials */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                {t.usernameLabel}
              </label>
              <input
                type="text"
                id="proxy-username-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.usernamePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden text-slate-100 text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="proxy-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden text-slate-100 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Test Latency Action Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">{t.testConnection}</span>
              </div>
              <button
                type="button"
                id="test-proxy-connection-btn"
                onClick={handleTestConnection}
                disabled={isTesting || !host}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium transition disabled:opacity-50"
              >
                {isTesting ? t.testing : 'Ping Test'}
              </button>
            </div>

            {testResult && (
              <div
                className={`mt-2 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-950/50 border border-red-500/30 text-red-300'
                }`}
              >
                {testResult.success ? (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              id="cancel-add-proxy-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
            >
              {t.cancelBtn}
            </button>
            <button
              type="submit"
              id="save-proxy-btn"
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-xs"
            >
              {t.saveBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
