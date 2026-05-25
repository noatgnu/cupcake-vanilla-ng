import { Component, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { DeviceTokenManagement } from '@noatgnu/cupcake-core';

@Component({
  selector: 'app-user-devices-page',
  imports: [DeviceTokenManagement],
  templateUrl: './user-devices-page.html',
  styleUrl: './user-devices-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDevicesPage {
  @ViewChild(DeviceTokenManagement) deviceTokenManager!: DeviceTokenManagement;

  openCreate(): void {
    this.deviceTokenManager.openCreate();
  }
}
