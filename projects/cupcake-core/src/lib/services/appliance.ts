import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BackupLog, BackupRunRequest, BlockDevice, StorageConfig, StorageStatus, WifiConfig, WifiStatus } from '../models/appliance';
import { BaseApiService } from './base-api';

@Injectable({ providedIn: 'root' })
export class ApplianceService extends BaseApiService {

  private get base(): string {
    return `${this.apiUrl}/appliance`;
  }

  getStorageStatus(): Observable<StorageStatus> {
    return this.get<StorageStatus>(`${this.base}/storage-status/`);
  }

  applyStorage(config: StorageConfig): Observable<{ output: string }> {
    return this.post<{ output: string }>(`${this.base}/apply-storage/`, { config });
  }

  unmountStorage(): Observable<{ output: string }> {
    return this.post<{ output: string }>(`${this.base}/unmount-storage/`, {});
  }

  getBlockDevices(): Observable<{ devices: BlockDevice[] }> {
    return this.get<{ devices: BlockDevice[] }>(`${this.base}/block-devices/`);
  }

  getBackupLogs(): Observable<BackupLog[]> {
    return this.get<BackupLog[]>(`${this.base}/`);
  }

  runBackup(req: BackupRunRequest): Observable<BackupLog> {
    return this.post<BackupLog>(`${this.base}/run-backup/`, req);
  }

  getBackupLog(id: number): Observable<BackupLog> {
    return this.get<BackupLog>(`${this.base}/${id}/`);
  }

  getWifiInterfaces(): Observable<{ interfaces: string[] }> {
    return this.get<{ interfaces: string[] }>(`${this.base}/wifi-interfaces/`);
  }

  getWifiStatus(): Observable<WifiStatus> {
    return this.get<WifiStatus>(`${this.base}/wifi-status/`);
  }

  applyWifi(config: WifiConfig): Observable<{ output: string }> {
    return this.post<{ output: string }>(`${this.base}/apply-wifi/`, { config });
  }

  disableWifi(): Observable<{ output: string }> {
    return this.post<{ output: string }>(`${this.base}/disable-wifi/`, {});
  }

  uploadWifiCert(file: File, certType: 'ca' | 'client_cert' | 'client_key'): Observable<{ filename: string }> {
    const form = new FormData();
    form.append('file', file);
    form.append('cert_type', certType);
    return this.post<{ filename: string }>(`${this.base}/upload-wifi-cert/`, form);
  }
}
