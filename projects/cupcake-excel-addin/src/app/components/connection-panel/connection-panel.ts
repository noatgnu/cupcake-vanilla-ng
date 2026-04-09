import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConnectionService, ConnectionMode, OFFICIAL_CLOUD_URL } from '../../core/services/connection.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-connection-panel',
  imports: [FormsModule],
  templateUrl: './connection-panel.html',
  styleUrl: './connection-panel.scss',
})
export class ConnectionPanel {
  private connectionService = inject(ConnectionService);
  private toastService = inject(ToastService);

  readonly mode = this.connectionService.mode;
  readonly cloudUrl = this.connectionService.cloudUrl;
  readonly localUrl = this.connectionService.localUrl;
  readonly isConnected = this.connectionService.isConnected;
  readonly isChecking = this.connectionService.isChecking;
  readonly officialCloudUrl = OFFICIAL_CLOUD_URL;

  readonly showAdvanced = signal(false);
  readonly customCloudUrl = signal(this.cloudUrl());
  readonly customLocalUrl = signal(this.localUrl());

  readonly isOfficialCloud = computed(() => this.connectionService.isOfficialCloudUrl());
  readonly hasCustomCloudUrl = computed(() => this.customCloudUrl() !== this.connectionService.getDefaultCloudUrl());
  readonly hasCustomLocalUrl = computed(() => this.customLocalUrl() !== this.connectionService.getDefaultLocalUrl());

  setMode(mode: ConnectionMode): void {
    this.connectionService.setMode(mode);
    this.testConnection();
  }

  toggleAdvanced(): void {
    this.showAdvanced.update(v => !v);
    if (this.showAdvanced()) {
      this.customCloudUrl.set(this.cloudUrl());
      this.customLocalUrl.set(this.localUrl());
    }
  }

  saveUrls(): void {
    this.connectionService.setCloudUrl(this.customCloudUrl());
    this.connectionService.setLocalUrl(this.customLocalUrl());
    this.toastService.success('Connection settings saved');
    this.testConnection();
  }

  resetCloudUrl(): void {
    this.connectionService.resetCloudUrl();
    this.customCloudUrl.set(this.connectionService.getDefaultCloudUrl());
    this.toastService.info('Cloud URL reset to official');
    if (this.mode() === 'cloud') {
      this.testConnection();
    }
  }

  resetLocalUrl(): void {
    this.connectionService.resetLocalUrl();
    this.customLocalUrl.set(this.connectionService.getDefaultLocalUrl());
    this.toastService.info('Local URL reset to default');
    if (this.mode() === 'local') {
      this.testConnection();
    }
  }

  async testConnection(): Promise<void> {
    const connected = await this.connectionService.testConnection();
    if (connected) {
      this.toastService.success('Connected successfully');
    } else {
      this.toastService.error('Connection failed');
    }
  }

  async detectLocal(): Promise<void> {
    const detected = await this.connectionService.detectLocalBackend();
    if (detected) {
      this.connectionService.setMode('local');
      this.toastService.success('Local backend detected');
    } else {
      this.toastService.warning('No local backend found');
    }
  }
}
