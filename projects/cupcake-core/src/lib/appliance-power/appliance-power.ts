import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, catchError, map, of, switchMap, timer } from 'rxjs';

import { AppliancePowerAction } from '../models/appliance';
import { ApplianceService } from '../services/appliance';
import { AuthService } from '../services/auth';
import { ConfirmDialogService } from '../services/confirm-dialog';
import { ToastService } from '../services/toast';

interface PowerOption {
  action: AppliancePowerAction;
  label: string;
  icon: string;
  description: string;
  confirm: string;
  buttonClass: string;
}

type PowerState = 'idle' | 'sending' | 'waiting' | 'back' | 'off' | 'slow';

const POLL_START_MS = 8000;
const POLL_EVERY_MS = 4000;
const GIVE_UP_MS = 10 * 60 * 1000;

@Component({
  selector: 'ccc-appliance-power',
  imports: [],
  templateUrl: './appliance-power.html',
  styleUrl: './appliance-power.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppliancePower {
  private applianceService = inject(ApplianceService);
  private authService = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private polling?: Subscription;

  readonly options: PowerOption[] = [
    {
      action: 'restart-backend',
      label: 'Restart backend',
      icon: 'bi-arrow-repeat',
      description: 'Restarts the backend and its background workers. Pages reconnect in about a minute; running imports and exports are interrupted.',
      confirm: 'Restart the backend? Everyone using the appliance loses their connection for about a minute and running background jobs stop.',
      buttonClass: 'btn-outline-warning',
    },
    {
      action: 'reboot',
      label: 'Restart appliance',
      icon: 'bi-bootstrap-reboot',
      description: 'Restarts the whole appliance. It is back in a few minutes at the same address.',
      confirm: 'Restart the appliance? Everyone is disconnected until it has started again, usually a few minutes.',
      buttonClass: 'btn-outline-warning',
    },
    {
      action: 'shutdown',
      label: 'Shut down appliance',
      icon: 'bi-power',
      description: 'Powers the appliance off. Someone has to switch it back on at the device.',
      confirm: 'Shut the appliance down? It stays off until someone switches it on at the device.',
      buttonClass: 'btn-outline-danger',
    },
  ];

  isSuperuser = computed(() => !!this.authService.currentUser()?.isSuperuser);
  state = signal<PowerState>('idle');
  current = signal<PowerOption | null>(null);
  busy = computed(() => this.state() === 'sending' || this.state() === 'waiting');

  constructor() {
    this.destroyRef.onDestroy(() => this.polling?.unsubscribe());
  }

  async run(option: PowerOption): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: option.label,
      message: option.confirm,
      confirmLabel: option.label,
      confirmClass: option.action === 'shutdown' ? 'btn-danger' : 'btn-warning',
    });
    if (!confirmed) {
      return;
    }
    this.current.set(option);
    this.state.set('sending');
    this.applianceService.power(option.action).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => {
        this.toast.info(response.message);
        if (option.action === 'shutdown') {
          this.state.set('off');
        } else {
          this.state.set('waiting');
          this.waitUntilBack();
        }
      },
      error: error => {
        this.state.set('idle');
        this.toast.error(error?.error?.error || error?.error?.detail || `${option.label} failed`);
      },
    });
  }

  private waitUntilBack(): void {
    let wentDown = false;
    const started = Date.now();
    this.polling?.unsubscribe();
    this.polling = timer(POLL_START_MS, POLL_EVERY_MS).pipe(
      switchMap(() => this.applianceService.getNetworkInfo().pipe(map(() => true), catchError(() => of(false)))),
    ).subscribe(up => {
      if (!up) {
        wentDown = true;
      }
      if (up && (wentDown || Date.now() - started > 60000)) {
        this.polling?.unsubscribe();
        this.state.set('back');
        this.toast.success('The appliance is answering again');
      } else if (Date.now() - started > GIVE_UP_MS) {
        this.polling?.unsubscribe();
        this.state.set('slow');
      }
    });
  }
}
