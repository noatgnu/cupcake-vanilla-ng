import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PluginWidgetDefinition } from '../../models/plugin';
import { PluginCard } from '../plugin-card/plugin-card';
import { PluginChart } from '../plugin-chart/plugin-chart';
import { PluginForm } from '../plugin-form/plugin-form';
import { PluginList } from '../plugin-list/plugin-list';
import { PluginTable } from '../plugin-table/plugin-table';

@Component({
  selector: 'ccc-plugin-widget',
  imports: [PluginCard, PluginList, PluginForm, PluginChart, PluginTable],
  templateUrl: './plugin-widget.html',
  styleUrl: './plugin-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginWidget {
  definition = input.required<PluginWidgetDefinition>();
  pluginId = input.required<number>();
  live = input<unknown>(undefined);
}
