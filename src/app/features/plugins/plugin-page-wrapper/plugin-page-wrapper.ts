import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PluginPage } from '@noatgnu/cupcake-core';

@Component({
  selector: 'app-plugin-page-wrapper',
  imports: [PluginPage],
  templateUrl: './plugin-page-wrapper.html',
  styleUrl: './plugin-page-wrapper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginPageWrapper {}
