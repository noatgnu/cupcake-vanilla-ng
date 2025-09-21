import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SdrfSyntaxService, AgeFormat } from '../../services/sdrf-syntax';

@Component({
  selector: 'ccv-sdrf-age-input',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sdrf-age-input.html',
  styleUrl: './sdrf-age-input.scss'
})
export class SdrfAgeInput implements OnInit {
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  private fb = inject(FormBuilder);
  private sdrfSyntax = inject(SdrfSyntaxService);

  ageForm!: FormGroup;
  isRange = false;

  ngOnInit() {
    this.ageForm = this.fb.group({
      isRange: [false],
      years: [null, [Validators.min(0), Validators.max(200)]],
      months: [null, [Validators.min(0), Validators.max(11)]],
      days: [null, [Validators.min(0), Validators.max(31)]],
      weeks: [null, [Validators.min(0), Validators.max(520)]],
      rangeStartYears: [null, [Validators.min(0), Validators.max(200)]],
      rangeStartMonths: [null, [Validators.min(0), Validators.max(11)]],
      rangeEndYears: [null, [Validators.min(0), Validators.max(200)]],
      rangeEndMonths: [null, [Validators.min(0), Validators.max(11)]]
    });

    // Parse initial value
    if (this.value) {
      this.parseAndSetValue(this.value);
    }

    // Subscribe to form changes
    this.ageForm.valueChanges.subscribe(() => {
      this.updateValue();
    });

    // Subscribe to range toggle
    this.ageForm.get('isRange')?.valueChanges.subscribe((isRange) => {
      this.isRange = isRange;
      this.updateValue();
    });
  }

  private parseAndSetValue(value: string) {
    try {
      const parsed = this.sdrfSyntax.parseValue('age', value) as AgeFormat;
      if (parsed.isRange && parsed.rangeStart && parsed.rangeEnd) {
        this.ageForm.patchValue({
          isRange: true,
          rangeStartYears: parsed.rangeStart.years,
          rangeStartMonths: parsed.rangeStart.months,
          rangeEndYears: parsed.rangeEnd.years,
          rangeEndMonths: parsed.rangeEnd.months
        });
        this.isRange = true;
      } else {
        this.ageForm.patchValue({
          isRange: false,
          years: parsed.years,
          months: parsed.months,
          days: parsed.days
        });
      }
    } catch (error) {
      console.warn('Could not parse age value:', value);
    }
  }

  private updateValue() {
    const formValue = this.ageForm.value;
    
    if (formValue.isRange) {
      if (formValue.rangeStartYears || formValue.rangeEndYears) {
        const ageData: AgeFormat = {
          isRange: true,
          rangeStart: {
            years: formValue.rangeStartYears || 0,
            months: formValue.rangeStartMonths || 0
          },
          rangeEnd: {
            years: formValue.rangeEndYears || 0,
            months: formValue.rangeEndMonths || 0
          }
        };
        
        const formatted = this.sdrfSyntax.formatValue('age', ageData);
        this.valueChange.emit(formatted);
      }
    } else {
      if (formValue.years || formValue.months || formValue.days || formValue.weeks) {
        const ageData: AgeFormat = {
          years: formValue.years || undefined,
          months: formValue.months || undefined,
          days: formValue.days || undefined
        };
        
        // Handle weeks separately (convert to special format)
        if (formValue.weeks && !formValue.years && !formValue.months && !formValue.days) {
          const formatted = `${formValue.weeks}W`;
          this.valueChange.emit(formatted);
        } else {
          const formatted = this.sdrfSyntax.formatValue('age', ageData);
          this.valueChange.emit(formatted);
        }
      }
    }
  }
}
