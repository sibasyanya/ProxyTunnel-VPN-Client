export type Protocol = 'socks5' | 'http';

export interface ProxyProfile {
  id: string;
  name: string;
  protocol: Protocol;
  host: string;
  port: number;
  username?: string;
  password?: string;
  ping?: number;
  isDefault?: boolean;
  lastTested?: string;
  country?: string;
  countryCode?: string;
  city?: string;
  ip?: string;
  status?: 'active' | 'online' | 'error' | 'untested';
}

export interface BypassApp {
  id: string;
  name: string;
  executable: string;
  path: string;
  iconName: string;
  enabled: boolean;
  category: 'browser' | 'messenger' | 'game' | 'development' | 'system' | 'custom';
  description?: string;
}

export type BypassMode = 'blacklist' | 'whitelist';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error';

export interface NetworkStats {
  uploadSpeed: number; // bytes per second
  downloadSpeed: number; // bytes per second
  totalUploaded: number; // bytes
  totalDownloaded: number; // bytes
  latency: number; // ms
  activeIp: string;
  activeCountry: string;
  activeCountryCode: string;
  activeCity: string;
  isp: string;
  uptimeSeconds: number;
  dnsServer: string;
  tunAdapter: string;
  packetsIn: number;
  packetsOut: number;
}

export type AppLanguage = 'en' | 'ru';
export type AppTheme = 'dark' | 'light';
export type DnsProvider = 'cloudflare' | 'google' | 'quad9' | 'custom';

export interface AppSettings {
  language: AppLanguage;
  theme: AppTheme;
  autoStart: boolean;
  minimizeToTray: boolean;
  killSwitch: boolean;
  dnsProvider: DnsProvider;
  customDns: string;
  tunMtu: number;
  ipv6Block: boolean;
  bypassMode: BypassMode;
  notificationsEnabled: boolean;
  autoConnectOnLaunch: boolean;
}

export type ActiveTab = 'dashboard' | 'proxies' | 'bypass' | 'help' | 'settings';
