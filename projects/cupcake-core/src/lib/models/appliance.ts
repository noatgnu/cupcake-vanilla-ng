import { Plugin } from './plugin';

export interface StorageStatus {
  mounted: boolean;
  mountPoint: string;
  device: string;
  fsType: string;
  config: StorageConfig;
}

export interface StorageConfig {
  mountType: 'usb' | 'nfs' | 'smb';
  label?: string;
  host?: string;
  share?: string;
  username?: string;
  password?: string;
}

export interface BlockDevice {
  name: string;
  label: string;
  size: string;
  fsType: string;
}

export interface BackupLog {
  id: number;
  backupType: 'database' | 'media' | 'full';
  status: 'running' | 'completed' | 'failed';
  destination: string;
  sizeBytes: number | null;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string;
  triggeredByUsername: string;
}

export interface BackupRunRequest {
  backupType: 'database' | 'media' | 'full';
  destination: string;
}

export interface WifiConfig {
  ssid: string;
  interfaceName: string;
  authType: 'wpa2-personal' | 'wpa2-enterprise';
  eapMethod?: 'peap' | 'ttls' | 'tls';
  phase2Auth?: 'mschapv2' | 'pap' | 'chap';
  identity?: string;
  anonymousIdentity?: string;
  password?: string;
  caCertFilename?: string;
  clientCertFilename?: string;
  clientKeyFilename?: string;
}

export interface WifiStatus {
  hasInterface: boolean;
  interfaceName: string | null;
  connected: boolean;
  ssid: string | null;
  config: WifiConfig | null;
}

export interface TailscaleStatus {
  installed: boolean;
  configured: boolean;
  connected: boolean;
  state: string;
  dnsName: string;
  addresses: string[];
  online: boolean;
  health: string[];
  error: string;
}

export interface CloudflareStatus {
  installed: boolean;
  configured: boolean;
  active: boolean;
  connected: boolean;
  connections: number;
  error: string;
}

export interface RemoteAccessState {
  tailscale: TailscaleStatus;
  cloudflare: CloudflareStatus;
}

export interface InstalledPlugin {
  name: string;
  active: boolean;
  enabled: boolean;
}

export type PluginServiceCommand = 'start' | 'stop' | 'restart' | 'enable' | 'disable';

export interface PluginPackagePreview {
  uploadId: string;
  name: string;
  displayName: string;
  version: string;
  description: string;
  pages: string[];
  vocabularies: string[];
  installedVersion: string | null;
}

export interface PluginPackageInstalled {
  plugin: Plugin;
  port: number;
}
