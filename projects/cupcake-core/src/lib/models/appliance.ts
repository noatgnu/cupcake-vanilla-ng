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
