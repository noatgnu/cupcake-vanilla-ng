import { Component, signal, input, output, OnInit, inject, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SdrfSyntaxService, AgeFormat } from '@noatgnu/cupcake-vanilla';

@Component({
  selector: 'app-age-input',
  imports: [FormsModule],
  templateUrl: './age-input.html',
  styleUrl: './age-input.scss',
})
export class AgeInput implements OnInit {
  private sdrfSyntax = inject(SdrfSyntaxService);

  readonly value = input<string>('');
  readonly valueChange = output<string>();

  readonly isRange = signal(false);
  readonly years = signal<number | null>(null);
  readonly months = signal<number | null>(null);
  readonly days = signal<number | null>(null);
  readonly rangeStartYears = signal<number | null>(null);
  readonly rangeStartMonths = signal<number | null>(null);
  readonly rangeEndYears = signal<number | null>(null);
  readonly rangeEndMonths = signal<number | null>(null);

  constructor() {
    effect(() => {
      this.emitValue();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    const v = this.value();
    if (v) {
      this.parseValue(v);
    }
  }

  private parseValue(value: string): void {
    try {
      const parsed = this.sdrfSyntax.parseValue('age', value) as AgeFormat;
      if (parsed.isRange && parsed.rangeStart && parsed.rangeEnd) {
        this.isRange.set(true);
        this.rangeStartYears.set(parsed.rangeStart.years ?? null);
        this.rangeStartMonths.set(parsed.rangeStart.months ?? null);
        this.rangeEndYears.set(parsed.rangeEnd.years ?? null);
        this.rangeEndMonths.set(parsed.rangeEnd.months ?? null);
      } else {
        this.isRange.set(false);
        this.years.set(parsed.years ?? null);
        this.months.set(parsed.months ?? null);
        this.days.set(parsed.days ?? null);
      }
    } catch {
      // Unable to parse
    }
  }

  private emitValue(): void {
    if (this.isRange()) {
      const startY = this.rangeStartYears();
      const endY = this.rangeEndYears();
      if (startY !== null || endY !== null) {
        const ageData: AgeFormat = {
          isRange: true,
          rangeStart: {
            years: startY ?? 0,
            months: this.rangeStartMonths() ?? 0
          },
          rangeEnd: {
            years: endY ?? 0,
            months: this.rangeEndMonths() ?? 0
          }
        };
        const formatted = this.sdrfSyntax.formatValue('age', ageData);
        this.valueChange.emit(formatted);
      }
    } else {
      const y = this.years();
      const m = this.months();
      const d = this.days();
      if (y !== null || m !== null || d !== null) {
        const ageData: AgeFormat = {
          years: y ?? undefined,
          months: m ?? undefined,
          days: d ?? undefined
        };
        const formatted = this.sdrfSyntax.formatValue('age', ageData);
        this.valueChange.emit(formatted);
      }
    }
  }

  toggleRange(): void {
    this.isRange.update(v => !v);
  }
}
