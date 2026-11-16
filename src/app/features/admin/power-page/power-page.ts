import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AppliancePower } from '@noatgnu/cupcake-core';

@Component({
  selector: 'app-power-page',
  imports: [AppliancePower],
  templateUrl: './power-page.html',
  styleUrl: './power-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PowerPage {}
