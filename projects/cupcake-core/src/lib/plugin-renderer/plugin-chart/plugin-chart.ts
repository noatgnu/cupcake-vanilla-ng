import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, OnInit, signal, untracked } from '@angular/core';

import { PluginChartData, PluginWidgetDefinition } from '../../models/plugin';
import { PluginRendererService } from '../../services/plugin-renderer';
import { pollEvery } from '../polling';

export const MAX_SERIES = 8;
const WIDTH = 1000;
const HEIGHT = 100;
const TICKS = 4;

export interface ChartSeries {
  label: string;
  slot: number;
  values: (number | null)[];
  path: string;
}

export interface ChartTick {
  value: number;
  top: number;
}

export interface ChartGeometry {
  labels: string[];
  series: ChartSeries[];
  ticks: ChartTick[];
  unit: string;
}

function niceStep(range: number): number {
  const raw = range / TICKS;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const residual = raw / magnitude;
  const nice = residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1;
  return nice * magnitude;
}

export function chartGeometry(data: PluginChartData | null): ChartGeometry | null {
  if (!data || !Array.isArray(data.labels) || !Array.isArray(data.datasets) || data.labels.length === 0) {
    return null;
  }
  const datasets = data.datasets.slice(0, MAX_SERIES);
  const finite = datasets.flatMap(d => (d.data ?? []).filter(v => typeof v === 'number' && Number.isFinite(v)));
  if (finite.length === 0) {
    return null;
  }
  let low = Math.min(...finite);
  let high = Math.max(...finite);
  if (low === high) {
    low -= 1;
    high += 1;
  }
  const step = niceStep(high - low);
  low = Math.floor(low / step) * step;
  high = Math.ceil(high / step) * step;
  const count = data.labels.length;
  const x = (index: number) => (count === 1 ? WIDTH / 2 : (index / (count - 1)) * WIDTH);
  const y = (value: number) => HEIGHT - ((value - low) / (high - low)) * HEIGHT;

  const series = datasets.map((dataset, slot) => {
    const values = data.labels.map((_, index) => {
      const value = dataset.data?.[index];
      return typeof value === 'number' && Number.isFinite(value) ? value : null;
    });
    let path = '';
    let pen = false;
    values.forEach((value, index) => {
      if (value === null) {
        pen = false;
        return;
      }
      path += `${pen ? 'L' : 'M'}${x(index).toFixed(1)},${y(value).toFixed(1)}`;
      pen = true;
    });
    return { label: dataset.label, slot: slot + 1, values, path };
  });

  const ticks: ChartTick[] = [];
  for (let value = low; value <= high + step / 2; value += step) {
    ticks.push({ value: Number(value.toFixed(6)), top: (y(value) / HEIGHT) * 100 });
  }
  return { labels: data.labels, series, ticks, unit: data.unit ?? '' };
}

@Component({
  selector: 'ccc-plugin-chart',
  imports: [],
  templateUrl: './plugin-chart.html',
  styleUrl: './plugin-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PluginChart implements OnInit {
  definition = input.required<PluginWidgetDefinition>();
  pluginId = input.required<number>();
  live = input<unknown>(undefined);

  data = signal<PluginChartData | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  hover = signal<number | null>(null);
  showTable = signal(false);

  readonly width = WIDTH;
  readonly height = HEIGHT;
  readonly geometry = computed(() => chartGeometry(this.data()));
  readonly hoverLeft = computed(() => {
    const geometry = this.geometry();
    const index = this.hover();
    if (!geometry || index === null) return null;
    return geometry.labels.length === 1 ? 50 : (index / (geometry.labels.length - 1)) * 100;
  });

  private renderer = inject(PluginRendererService);
  private destroyRef = inject(DestroyRef);
  private loaded = false;

  constructor() {
    effect(() => {
      const v = this.live();
      if (v === undefined) return;
      untracked(() => {
        this.data.set(v as PluginChartData);
        this.loaded = true;
        this.loading.set(false);
        this.error.set(null);
      });
    });
  }

  ngOnInit(): void {
    this.load();
    pollEvery(this.destroyRef, this.definition().refreshInterval, () => this.load());
  }

  load(): void {
    const endpoint = this.definition().endpoint;
    if (!endpoint) return;
    this.loading.set(!this.loaded);
    this.error.set(null);
    this.renderer.fetch<PluginChartData>(this.pluginId(), endpoint).subscribe({
      next: d => { this.data.set(d); this.loaded = true; this.loading.set(false); },
      error: e => { this.error.set(e.message); this.loading.set(false); },
    });
  }

  track(event: PointerEvent): void {
    const geometry = this.geometry();
    const target = event.currentTarget as HTMLElement;
    if (!geometry || !target) return;
    const box = target.getBoundingClientRect();
    const ratio = box.width ? Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1) : 0;
    this.hover.set(Math.round(ratio * (geometry.labels.length - 1)));
  }

  step(event: KeyboardEvent): void {
    const geometry = this.geometry();
    if (!geometry) return;
    const last = geometry.labels.length - 1;
    const current = this.hover() ?? last;
    if (event.key === 'ArrowLeft') {
      this.hover.set(Math.max(current - 1, 0));
      event.preventDefault();
    } else if (event.key === 'ArrowRight') {
      this.hover.set(Math.min(current + 1, last));
      event.preventDefault();
    }
  }

  format(value: number | null, unit: string): string {
    if (value === null) return '—';
    const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
    return unit ? `${text} ${unit}` : text;
  }
}
