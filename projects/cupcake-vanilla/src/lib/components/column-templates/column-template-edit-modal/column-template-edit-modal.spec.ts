import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';
import { OntologyTypeConfig, MetadataColumnTemplate } from '../../../models';
import { VocabularyService } from '../../../services';
import { ColumnTemplateEditModal } from './column-template-edit-modal';

const CHOICES: OntologyTypeConfig[] = [
  { value: '', label: 'None', customFilters: undefined },
  { value: 'mondo', label: 'MONDO Disease', customFilters: undefined },
  { value: 'ms_unique_vocabularies', label: 'Sample Attribute (MS)', customFilters: { ms_unique_vocabularies: { term_type: 'sample attribute' } } },
  { value: 'ms_unique_vocabularies', label: 'Instrument (MS)', customFilters: { ms_unique_vocabularies: { term_type: 'instrument' } } }
];

function configure(component: unknown): void {
  TestBed.configureTestingModule({
    imports: [component as never],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost:8000/api/v1' } },
      NgbActiveModal,
      { provide: VocabularyService, useValue: { getOntologyTypeChoices: () => of(CHOICES) } }
    ]
  });
}

describe('ColumnTemplateEditModal', () => {
  let fb: FormBuilder;
  let form: FormGroup;

  beforeEach(() => {
    fb = new FormBuilder();
    form = fb.group({
      name: ['', [Validators.required]],
      columnName: ['', [Validators.required]],
      columnType: ['characteristic', [Validators.required]],
      inputType: ['text'],
      description: [''],
      isActive: [true]
    });
  });

  it('should initialize form with default values', () => {
    expect(form.get('name')?.value).toBe('');
    expect(form.get('columnType')?.value).toBe('characteristic');
    expect(form.get('isActive')?.value).toBe(true);
  });

  it('should validate required fields', () => {
    expect(form.valid).toBeFalse();
    form.patchValue({
      name: 'Test Template',
      columnName: 'test_column'
    });
    expect(form.valid).toBeTrue();
  });

  it('should allow updating input type', () => {
    form.patchValue({ inputType: 'select' });
    expect(form.get('inputType')?.value).toBe('select');
  });
});

describe('ColumnTemplateEditModal ontology types', () => {
  beforeEach(() => configure(ColumnTemplateEditModal));

  it('lists the vocabularies from the backend and selects the saved preset', () => {
    const fixture = TestBed.createComponent(ColumnTemplateEditModal);
    const component = fixture.componentInstance;
    component.template = {
      name: 'Instrument',
      columnName: 'instrument',
      columnType: 'comment',
      ontologyType: 'ms_unique_vocabularies',
      customOntologyFilters: { ms_unique_vocabularies: { term_type: 'instrument' } }
    } as unknown as MetadataColumnTemplate;
    component.isEdit = true;
    fixture.detectChanges();

    expect(component.ontologyTypes().map(choice => choice.label)).toEqual(CHOICES.map(choice => choice.label));
    expect(component.editForm.get('ontologyType')?.value).toBe('ms_unique_vocabularies__3');
    expect(component.editForm.get('customOntologyFilters')?.value).toEqual({ ms_unique_vocabularies: { term_type: 'instrument' } });
  });
});
