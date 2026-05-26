import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApplianceService } from '../services/appliance';
import { WifiConfig, WifiStatus } from '../models/appliance';

@Component({
  selector: 'ccc-wifi-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './wifi-management.html',
  styleUrl: './wifi-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WifiManagement implements OnInit {
  private fb = inject(FormBuilder);
  private applianceService = inject(ApplianceService);

  status = signal<WifiStatus | null>(null);
  interfaces = signal<string[]>([]);
  loading = signal(false);
  applyLoading = signal(false);
  disableLoading = signal(false);
  error = signal<string | null>(null);
  validationError = signal<string | null>(null);
  output = signal<string | null>(null);

  caUploading = signal(false);
  clientCertUploading = signal(false);
  clientKeyUploading = signal(false);
  caFilename = signal<string | null>(null);
  clientCertFilename = signal<string | null>(null);
  clientKeyFilename = signal<string | null>(null);
  certError = signal<string | null>(null);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      interfaceName: ['', Validators.required],
      ssid: ['', [Validators.required, Validators.maxLength(32)]],
      authType: ['wpa2-enterprise', Validators.required],
      eapMethod: ['peap'],
      phase2Auth: ['mschapv2'],
      identity: [''],
      anonymousIdentity: [''],
      password: [''],
    });
  }

  ngOnInit(): void {
    this.loadStatus();
    this.loadInterfaces();
  }

  get authType(): string {
    return this.form.get('authType')?.value ?? 'wpa2-enterprise';
  }

  get eapMethod(): string {
    return this.form.get('eapMethod')?.value ?? 'peap';
  }

  loadStatus(): void {
    this.loading.set(true);
    this.error.set(null);
    this.applianceService.getWifiStatus().subscribe({
      next: (s) => {
        this.status.set(s);
        this.loading.set(false);
        if (s.config) {
          this.form.patchValue({
            interfaceName: s.config.interfaceName ?? '',
            ssid: s.config.ssid ?? '',
            authType: s.config.authType ?? 'wpa2-enterprise',
            eapMethod: s.config.eapMethod ?? 'peap',
            phase2Auth: s.config.phase2Auth ?? 'mschapv2',
            identity: s.config.identity ?? '',
            anonymousIdentity: s.config.anonymousIdentity ?? '',
          });
          this.caFilename.set(s.config.caCertFilename ?? null);
          this.clientCertFilename.set(s.config.clientCertFilename ?? null);
          this.clientKeyFilename.set(s.config.clientKeyFilename ?? null);
        }
      },
      error: (e) => {
        this.error.set(e?.error?.error ?? e?.error?.detail ?? 'Failed to load WiFi status');
        this.loading.set(false);
      }
    });
  }

  loadInterfaces(): void {
    this.applianceService.getWifiInterfaces().subscribe({
      next: (res) => {
        this.interfaces.set(res.interfaces);
        if (res.interfaces.length > 0 && !this.form.get('interfaceName')?.value) {
          this.form.patchValue({ interfaceName: res.interfaces[0] });
        }
      },
      error: () => {}
    });
  }

  onCertFileChange(event: Event, certType: 'ca' | 'client_cert' | 'client_key'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.certError.set(null);

    if (certType === 'ca') this.caUploading.set(true);
    else if (certType === 'client_cert') this.clientCertUploading.set(true);
    else this.clientKeyUploading.set(true);

    this.applianceService.uploadWifiCert(file, certType).subscribe({
      next: (res) => {
        if (certType === 'ca') { this.caFilename.set(res.filename); this.caUploading.set(false); }
        else if (certType === 'client_cert') { this.clientCertFilename.set(res.filename); this.clientCertUploading.set(false); }
        else { this.clientKeyFilename.set(res.filename); this.clientKeyUploading.set(false); }
      },
      error: (e) => {
        this.certError.set(e?.error?.error ?? 'Certificate upload failed');
        if (certType === 'ca') this.caUploading.set(false);
        else if (certType === 'client_cert') this.clientCertUploading.set(false);
        else this.clientKeyUploading.set(false);
      }
    });
  }

  private buildConfig(): WifiConfig {
    const v = this.form.value;
    const config: WifiConfig = {
      ssid: v.ssid.trim(),
      interfaceName: v.interfaceName,
      authType: v.authType,
    };
    if (v.authType === 'wpa2-personal') {
      config.password = v.password;
    } else {
      config.eapMethod = v.eapMethod;
      config.identity = v.identity;
      if (v.anonymousIdentity?.trim()) config.anonymousIdentity = v.anonymousIdentity.trim();
      if (v.eapMethod !== 'tls') {
        config.password = v.password;
        config.phase2Auth = v.phase2Auth;
      }
      if (this.caFilename()) config.caCertFilename = this.caFilename()!;
      if (v.eapMethod === 'tls') {
        config.clientCertFilename = this.clientCertFilename() ?? undefined;
        config.clientKeyFilename = this.clientKeyFilename() ?? undefined;
      }
    }
    return config;
  }

  private validate(): string | null {
    const v = this.form.value;
    if (!v.ssid?.trim()) return 'SSID is required';
    if (!v.interfaceName) return 'Interface is required';
    if (v.authType === 'wpa2-personal') {
      if (!v.password) return 'Password is required';
    } else {
      if (!v.eapMethod) return 'EAP method is required';
      if (!v.identity?.trim()) return 'Identity is required';
      if (v.eapMethod !== 'tls' && !v.password) return 'Password is required';
      if (v.eapMethod === 'tls') {
        if (!this.clientCertFilename()) return 'Client certificate must be uploaded first';
        if (!this.clientKeyFilename()) return 'Client key must be uploaded first';
      }
    }
    return null;
  }

  applyWifi(): void {
    this.validationError.set(null);
    const err = this.validate();
    if (err) { this.validationError.set(err); return; }

    this.applyLoading.set(true);
    this.output.set(null);
    this.error.set(null);
    this.applianceService.applyWifi(this.buildConfig()).subscribe({
      next: (res) => {
        this.output.set(res.output);
        this.applyLoading.set(false);
        this.loadStatus();
      },
      error: (e) => {
        this.error.set(e?.error?.error ?? e?.error?.detail ?? 'Failed to apply WiFi configuration');
        this.applyLoading.set(false);
      }
    });
  }

  disableWifi(): void {
    this.disableLoading.set(true);
    this.output.set(null);
    this.error.set(null);
    this.applianceService.disableWifi().subscribe({
      next: (res) => {
        this.output.set(res.output);
        this.disableLoading.set(false);
        this.loadStatus();
      },
      error: (e) => {
        this.error.set(e?.error?.error ?? e?.error?.detail ?? 'Failed to disable WiFi');
        this.disableLoading.set(false);
      }
    });
  }
}
