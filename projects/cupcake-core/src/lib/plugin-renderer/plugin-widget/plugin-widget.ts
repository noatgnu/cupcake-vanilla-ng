import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PluginWidgetDefinition } from '../../models/plugin';
import { PluginCard } from '../plugin-card/plugin-card';
import { PluginChart } from '../plugin-chart/plugin-chart';
import { PluginForm } from '../plugin-form/plugin-form';
import { PluginIframe } from '../plugin-iframe/plugin-iframe';
import { PluginList } from '../plugin-list/plugin-list';
import { PluginTable } from '../plugin-table/plugin-table';

@Component({
  selector: 'ccc-plugin-widget',
  imports: [PluginCard, PluginList, PluginForm, PluginChart, PluginTable, PluginIframe],
  templateUrl: './plugin-widget.html',
  styleUrl: './plugin-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginWidget {
  definition = input.required<PluginWidgetDefinition>();
  baseUrl = input.required<string>();
}
