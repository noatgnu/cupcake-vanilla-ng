import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BackupManagement } from '@noatgnu/cupcake-core';

@Component({
  selector: 'app-backup-page',
  imports: [BackupManagement],
  templateUrl: './backup-page.html',
  styleUrl: './backup-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BackupPage {}
