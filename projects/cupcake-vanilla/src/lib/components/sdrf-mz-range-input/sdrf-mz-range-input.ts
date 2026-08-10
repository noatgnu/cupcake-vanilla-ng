import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'ccv-sdrf-mz-range-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sdrf-mz-range-input.html',
  styleUrl: './sdrf-mz-range-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdrfMzRangeInput implements OnInit, OnChanges {
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      low: [''],
      high: [''],
    });
  }

  ngOnInit() {
    if (this.value) {
      this.parseAndSet(this.value);
    }
    this.form.valueChanges.subscribe(() => this.emitValue());
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value'] && !changes['value'].firstChange && this.form) {
      this.parseAndSet(this.value);
    }
  }

  private parseAndSet(value: string) {
    const match = value.match(/^(\d+(?:\.\d+)?)\s*m\/z\s*-\s*(\d+(?:\.\d+)?)\s*m\/z$/i);
    if (match) {
      this.form.patchValue({ low: match[1], high: match[2] }, { emitEvent: false });
    }
  }

  private emitValue() {
    const { low, high } = this.form.value;
    if (low && high) {
      this.valueChange.emit(`${low}m/z-${high}m/z`);
    } else {
      this.valueChange.emit('');
    }
  }
}
