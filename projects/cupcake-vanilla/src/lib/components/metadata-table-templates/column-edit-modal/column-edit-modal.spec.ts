import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of } from 'rxjs';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';
import { OntologyTypeConfig, MetadataColumn } from '../../../models';
import { VocabularyService } from '../../../services/vocabulary';
import { ColumnEditModal } from './column-edit-modal';

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

describe('ColumnEditModal', () => {
  let fb: FormBuilder;
  let form: FormGroup;

  beforeEach(() => {
    fb = new FormBuilder();
    form = fb.group({
      columnName: ['', [Validators.required]],
      columnType: ['characteristic'],
      position: [0]
    });
  });

  it('should initialize form with default values', () => {
    expect(form.get('columnName')?.value).toBe('');
    expect(form.get('columnType')?.value).toBe('characteristic');
    expect(form.get('position')?.value).toBe(0);
  });

  it('should validate required column name', () => {
    expect(form.valid).toBeFalse();
    form.patchValue({ columnName: 'test_column' });
    expect(form.valid).toBeTrue();
  });
});

describe('ColumnEditModal ontology types', () => {
  beforeEach(() => configure(ColumnEditModal));

  it('lists the vocabularies from the backend and selects the saved preset', () => {
    const fixture = TestBed.createComponent(ColumnEditModal);
    const component = fixture.componentInstance;
    component.column = {
      name: 'comment[instrument]',
      type: 'comment',
      ontologyType: 'ms_unique_vocabularies',
      customOntologyFilters: { ms_unique_vocabularies: { term_type: 'instrument' } }
    } as unknown as MetadataColumn;
    component.isEdit = true;
    fixture.detectChanges();

    expect(component.ontologyTypes()).toEqual(CHOICES);
    expect(component.editForm.get('ontologyType')?.value).toBe('3');
    expect(component.selectedOntologyConfig?.label).toBe('Instrument (MS)');
  });
});
