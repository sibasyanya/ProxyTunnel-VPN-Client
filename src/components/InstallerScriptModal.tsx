import React, { useState } from 'react';
import { X, Copy, Check, Terminal, FileCode } from 'lucide-react';
import { AppLanguage } from '../types';

interface InstallerScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: AppLanguage;
}

export const InstallerScriptModal: React.FC<InstallerScriptModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const innoScript = `; -- ProxyTunnel Windows 11 Single-File Installer Script (Inno Setup 6) --
#define MyAppName "ProxyTunnel VPN Client"
#define MyAppVersion "1.1.0"
#define MyAppPublisher "ProxyTunnel Core Team"
#define MyAppExeName "ProxyTunnel.exe"

[Setup]
AppId={{D68F2468-B01C-4B6A-8A45-9372E9D840A1}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=dist-installer
OutputBaseFilename=ProxyTunnel-Setup-x64
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=admin

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "russian"; MessagesFile: "compiler:Languages\\Russian.isl"

[Files]
Source: "bin\\ProxyTunnel.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "bin\\wintun.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "bin\\tunnel-service.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "assets\\*"; DestDir: "{app}\\assets"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"
Name: "{autodesktop}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "autostart"; Description: "Launch ProxyTunnel on Windows startup"

[Run]
; Install Wintun helper service silently
Filename: "{app}\\tunnel-service.exe"; Parameters: "install"; Flags: runhidden
; Launch client after installation
Filename: "{app}\\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(innoScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-200 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCode className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-base text-slate-100">
              {language === 'ru'
                ? 'Скрипт сборки одного инсталлятора (Inno Setup)'
                : 'Inno Setup Single-File Packaging Script'}
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

        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          <p className="text-slate-400">
            {language === 'ru'
              ? 'Этот скрипт используется для компиляции единого `.exe` файла установщика. Он упаковывает графическую оболочку, драйвер `wintun.dll` и фоновую службу маршрутизации.'
              : 'This script packages the GUI frontend, Wintun driver, and background routing service into a single Windows 11 setup installer (.exe).'}
          </p>

          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed max-h-80">
              {innoScript}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-3 top-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Script'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
