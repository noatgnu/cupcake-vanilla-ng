import { Component, ChangeDetectionStrategy } from '@angular/core';
import { WifiManagement } from '@noatgnu/cupcake-core';

@Component({
  selector: 'app-wifi-page',
  imports: [WifiManagement],
  templateUrl: './wifi-page.html',
  styleUrl: './wifi-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WifiPage {}
