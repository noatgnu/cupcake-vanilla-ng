import { Component, ChangeDetectionStrategy } from '@angular/core';
import { StorageManagement } from '@noatgnu/cupcake-core';

@Component({
  selector: 'app-storage-page',
  imports: [StorageManagement],
  templateUrl: './storage-page.html',
  styleUrl: './storage-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoragePage {}
