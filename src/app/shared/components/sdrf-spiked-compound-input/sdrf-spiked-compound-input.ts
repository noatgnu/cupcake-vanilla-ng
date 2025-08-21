import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SdrfSyntaxService, SpikedCompound } from '../../services/sdrf-syntax';

@Component({
  selector: 'app-sdrf-spiked-compound-input',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sdrf-spiked-compound-input.html',
  styleUrl: './sdrf-spiked-compound-input.scss'
})
export class SdrfSpikedCompoundInput implements OnInit {
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  private fb = inject(FormBuilder);
  private sdrfSyntax = inject(SdrfSyntaxService);

  spikedForm!: FormGroup;
  
  // Predefined options
  compoundTypes = ['protein', 'peptide', 'mixture', 'other'];

  ngOnInit() {
    this.spikedForm = this.fb.group({
      CT: ['', Validators.required], // Compound type - MANDATORY
      QY: ['', Validators.required], // Quantity - MANDATORY
      SP: [''], // Species - Optional
      PS: [''], // Peptide sequence - For peptides
      AC: [''], // Uniprot Accession - For proteins
      CN: [''], // Compound name - Optional
      CV: [''], // Compound vendor - Optional
      CS: [''], // Compound specification URI - Optional
      CF: [''] // Compound formula - Optional
    });

    // Parse initial value
    if (this.value) {
      this.parseAndSetValue(this.value);
    }

    // Subscribe to form changes
    this.spikedForm.valueChanges.subscribe(() => {
      this.updateValue();
    });
  }

  private parseAndSetValue(value: string) {
    try {
      const parsed = this.sdrfSyntax.parseValue('spiked_compound', value) as SpikedCompound;
      this.spikedForm.patchValue(parsed);
    } catch (error) {
      console.warn('Could not parse spiked compound value:', value);
    }
  }

  // Helper method to ensure we get string values from form controls
  private getStringValue(value: any): string {
    if (typeof value === 'string') {
      return value.trim();
    }
    
    // Handle objects from typeahead selection (OntologySuggestion)
    if (value && typeof value === 'object') {
      // For ontology suggestions, use the value property
      if (value.value) return value.value;
      if (value.name) return value.name;
    }
    
    // Fallback to string conversion
    return value ? String(value).trim() : '';
  }

  private updateValue() {
    const formValue = this.spikedForm.value;
    
    // Only emit if we have both required fields
    if (formValue.CT && formValue.QY) {
      // Filter out empty values and convert to strings
      const cleanedValue: SpikedCompound = {};
      Object.keys(formValue).forEach(key => {
        const stringValue = this.getStringValue(formValue[key]);
        if (stringValue) {
          cleanedValue[key as keyof SpikedCompound] = stringValue;
        }
      });

      const formatted = this.sdrfSyntax.formatValue('spiked_compound', cleanedValue);
      this.valueChange.emit(formatted);
    } else if (!formValue.CT && !formValue.QY) {
      // If both required fields are empty, emit empty string
      this.valueChange.emit('');
    }
  }

  get showProteinFields(): boolean {
    return this.spikedForm.get('CT')?.value === 'protein';
  }

  get showPeptideFields(): boolean {
    return this.spikedForm.get('CT')?.value === 'peptide';
  }
}
