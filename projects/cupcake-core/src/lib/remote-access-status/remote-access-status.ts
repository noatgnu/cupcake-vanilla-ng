import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import { RemoteAccessState } from '../models/appliance';
import { ApplianceService } from '../services/appliance';
import { ToastService } from '../services/toast';

@Component({
  selector: 'ccc-remote-access-status',
  imports: [DatePipe],
  templateUrl: './remote-access-status.html',
  styleUrl: './remote-access-status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteAccessStatus implements OnInit {
  private applianceService = inject(ApplianceService);
  private toast = inject(ToastService);

  status = signal<RemoteAccessState | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.applianceService.getRemoteAccessStatus().subscribe({
      next: status => {
        this.status.set(status);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Could not read the remote access status');
        this.loading.set(false);
      },
    });
  }
}
