import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'ccv-sdrf-number-with-unit-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sdrf-number-with-unit-input.html',
  styleUrl: './sdrf-number-with-unit-input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdrfNumberWithUnitInput implements OnInit, OnChanges {
  @Input() value: string = '';
  @Input() units: string[] = [];
  @Input() placeholder: string = 'Enter value';
  @Input() description: string = '';
  @Input() examples: (string | number)[] = [];
  @Output() valueChange = new EventEmitter<string>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      number: [''],
      unit: ['']
    });
  }

  ngOnInit() {
    if (this.units.length > 0) {
      this.form.patchValue({ unit: this.units[0] });
    }

    if (this.value) {
      this.parseAndSetValue(this.value);
    }

    this.form.valueChanges.subscribe(() => {
      this.updateValue();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value'] && !changes['value'].firstChange && this.form) {
      this.parseAndSetValue(this.value);
    }
    if (changes['units'] && !changes['units'].firstChange && this.form) {
      if (this.units.length > 0 && !this.form.get('unit')?.value) {
        this.form.patchValue({ unit: this.units[0] });
      }
    }
  }

  private parseAndSetValue(value: string) {
    if (!value) {
      this.form.patchValue({ number: '', unit: this.units[0] || '' }, { emitEvent: false });
      return;
    }

    const match = value.match(/^([\d.]+)\s*(.*)$/);
    if (match) {
      const numberPart = match[1];
      const unitPart = match[2].trim();

      this.form.patchValue({
        number: numberPart,
        unit: this.units.includes(unitPart) ? unitPart : (this.units[0] || unitPart)
      }, { emitEvent: false });
    } else {
      this.form.patchValue({ number: value, unit: this.units[0] || '' }, { emitEvent: false });
    }
  }

  private updateValue() {
    const formValue = this.form.value;
    if (formValue.number) {
      const formatted = formValue.unit ? `${formValue.number} ${formValue.unit}` : formValue.number;
      this.valueChange.emit(formatted);
    } else {
      this.valueChange.emit('');
    }
  }

  selectExample(example: string | number) {
    const exampleStr = String(example);
    this.parseAndSetValue(exampleStr);
    this.updateValue();
  }
}
