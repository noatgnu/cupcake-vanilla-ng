import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MaintenanceService } from '../services/maintenance';

@Component({
  selector: 'ccc-maintenance-overlay',
  imports: [],
  templateUrl: './maintenance-overlay.html',
  styleUrl: './maintenance-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceOverlay {
  readonly maintenance = inject(MaintenanceService);
}
