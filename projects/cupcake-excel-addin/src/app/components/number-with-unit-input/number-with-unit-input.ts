import { Component, input, output, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-number-with-unit-input',
  imports: [FormsModule],
  templateUrl: './number-with-unit-input.html',
  styleUrl: './number-with-unit-input.scss',
})
export class NumberWithUnitInput {
  readonly units = input<string[]>([]);
  readonly value = input<string>('');
  readonly valueChange = output<string>();

  readonly numberPart = signal<string>('');
  readonly unitPart = signal<string>('');

  constructor() {
    effect(() => {
      const raw = this.value();
      const parsed = this.parseValue(raw);
      this.numberPart.set(parsed.number);
      this.unitPart.set(parsed.unit || this.units()[0] || '');
    });
  }

  private parseValue(raw: string): { number: string; unit: string } {
    if (!raw) return { number: '', unit: '' };
    const match = raw.trim().match(/^([\d.+-]+)\s*(.*)$/);
    if (match) {
      return { number: match[1], unit: match[2].trim() };
    }
    return { number: '', unit: raw.trim() };
  }

  onNumberChange(val: string): void {
    this.numberPart.set(val);
    this.emit();
  }

  onUnitChange(val: string): void {
    this.unitPart.set(val);
    this.emit();
  }

  private emit(): void {
    const num = this.numberPart();
    const unit = this.unitPart();
    if (!num) {
      this.valueChange.emit('');
      return;
    }
    this.valueChange.emit(unit ? `${num} ${unit}` : num);
  }

  readonly formatted = computed(() => {
    const num = this.numberPart();
    const unit = this.unitPart();
    if (!num) return '';
    return unit ? `${num} ${unit}` : num;
  });
}
