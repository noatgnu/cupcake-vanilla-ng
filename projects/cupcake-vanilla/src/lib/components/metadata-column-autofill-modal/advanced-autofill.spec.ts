import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdvancedAutofillComponent } from './advanced-autofill';
import { MetadataColumn } from '../../models';

describe('AdvancedAutofillComponent', () => {
  let component: AdvancedAutofillComponent;
  let fixture: ComponentFixture<AdvancedAutofillComponent>;
  let mockModalService: jasmine.SpyObj<NgbModal>;

  const mockColumns: MetadataColumn[] = [
    {
      id: 1,
      metadataTable: 1,
      name: 'fraction_identifier',
      displayName: 'Fraction Identifier',
      type: 'text',
      columnPosition: 1,
      mandatory: false,
      hidden: false,
      readonly: false,
      value: '',
      modifiers: [],
      enableTypeahead: false
    },
    {
      id: 2,
      metadataTable: 1,
      name: 'label',
      displayName: 'Label',
      type: 'text',
      columnPosition: 2,
      mandatory: false,
      hidden: false,
      readonly: false,
      value: '',
      modifiers: [],
      enableTypeahead: true,
      ontologyType: 'ms'
    }
  ];

  beforeEach(async () => {
    mockModalService = jasmine.createSpyObj('NgbModal', ['open']);

    await TestBed.configureTestingModule({
      imports: [AdvancedAutofillComponent, ReactiveFormsModule],
      providers: [
        { provide: NgbModal, useValue: mockModalService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdvancedAutofillComponent);
    component = fixture.componentInstance;
    component.config = {
      metadataTableId: 1,
      sampleCount: 100,
      allColumns: mockColumns
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.advancedForm).toBeDefined();
    expect(component.advancedForm.get('templateSamples')?.value).toBe('');
    expect(component.advancedForm.get('targetSampleCount')?.value).toBeNull();
    expect(component.advancedForm.get('fillStrategy')?.value).toBe('cartesian_product');
    expect(component.variations.length).toBe(0);
  });

  describe('Variation Management', () => {
    it('should add range variation', () => {
      component.addVariation('range');
      expect(component.variations.length).toBe(1);
      expect(component.variations.at(0).get('type')?.value).toBe('range');
      expect(component.variations.at(0).get('start')?.value).toBe(1);
      expect(component.variations.at(0).get('end')?.value).toBe(10);
    });

    it('should add list variation', () => {
      component.addVariation('list');
      expect(component.variations.length).toBe(1);
      expect(component.variations.at(0).get('type')?.value).toBe('list');
    });

    it('should add pattern variation', () => {
      component.addVariation('pattern');
      expect(component.variations.length).toBe(1);
      expect(component.variations.at(0).get('type')?.value).toBe('pattern');
      expect(component.variations.at(0).get('pattern')?.value).toBe('{i}');
    });

    it('should remove variation', () => {
      component.addVariation('range');
      component.addVariation('list');
      expect(component.variations.length).toBe(2);

      component.removeVariation(0);
      expect(component.variations.length).toBe(1);
      expect(component.variations.at(0).get('type')?.value).toBe('list');
    });

    it('should get variation type', () => {
      component.addVariation('range');
      expect(component.getVariationType(0)).toBe('range');
    });
  });

  describe('Template Sample Parsing', () => {
    it('should parse comma-separated samples', () => {
      const result = component.parseTemplateSamples('1,2,3');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should parse range notation', () => {
      const result = component.parseTemplateSamples('1-5');
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should parse mixed notation', () => {
      const result = component.parseTemplateSamples('1,3-5,10');
      expect(result).toEqual([1, 3, 4, 5, 10]);
    });

    it('should handle empty string', () => {
      const result = component.parseTemplateSamples('');
      expect(result).toEqual([]);
    });

    it('should handle invalid input', () => {
      const result = component.parseTemplateSamples('abc');
      expect(result).toEqual([]);
    });
  });

  describe('Column Selection', () => {
    it('should get selected column', () => {
      component.addVariation('range');
      component.variations.at(0).patchValue({ columnId: 1 });

      const column = component.getSelectedColumn(0);
      expect(column).toBeDefined();
      expect(column?.id).toBe(1);
      expect(column?.name).toBe('fraction_identifier');
    });

    it('should return undefined for invalid column', () => {
      component.addVariation('range');
      const column = component.getSelectedColumn(0);
      expect(column).toBeUndefined();
    });

    it('should check if autocomplete is available', () => {
      component.addVariation('list');
      component.variations.at(0).patchValue({ columnId: 2 });

      expect(component.canOpenAutocomplete(0)).toBe(true);
    });

    it('should return false for column without typeahead', () => {
      component.addVariation('list');
      component.variations.at(0).patchValue({ columnId: 1 });

      expect(component.canOpenAutocomplete(0)).toBe(false);
    });
  });

  describe('Form Submission', () => {
    it('should not submit with invalid form', () => {
      spyOn(component.submit, 'emit');
      component.onSubmit();
      expect(component.submit.emit).not.toHaveBeenCalled();
    });

    it('should submit with valid range variation', () => {
      component.advancedForm.patchValue({
        templateSamples: '1,2',
        targetSampleCount: 20,
        fillStrategy: 'cartesian_product'
      });

      component.addVariation('range');
      component.variations.at(0).patchValue({
        columnId: 1,
        type: 'range',
        start: 1,
        end: 10,
        step: 1
      });

      spyOn(component.submit, 'emit');
      component.onSubmit();

      expect(component.submit.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        templateSamples: [1, 2],
        targetSampleCount: 20,
        fillStrategy: 'cartesian_product',
        variations: jasmine.arrayContaining([
          jasmine.objectContaining({
            columnId: 1,
            type: 'range',
            start: 1,
            end: 10,
            step: 1
          })
        ])
      }));
    });

    it('should submit with valid list variation', () => {
      component.advancedForm.patchValue({
        templateSamples: '1-5',
        targetSampleCount: 30,
        fillStrategy: 'sequential'
      });

      component.addVariation('list');
      component.variations.at(0).patchValue({
        columnId: 2,
        type: 'list',
        values: 'TMT126, TMT127, TMT128'
      });

      spyOn(component.submit, 'emit');
      component.onSubmit();

      expect(component.submit.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        templateSamples: [1, 2, 3, 4, 5],
        targetSampleCount: 30,
        fillStrategy: 'sequential',
        variations: jasmine.arrayContaining([
          jasmine.objectContaining({
            columnId: 2,
            type: 'list',
            values: ['TMT126', 'TMT127', 'TMT128']
          })
        ])
      }));
    });

    it('should submit with valid pattern variation', () => {
      component.advancedForm.patchValue({
        templateSamples: '1',
        targetSampleCount: 10,
        fillStrategy: 'interleaved'
      });

      component.addVariation('pattern');
      component.variations.at(0).patchValue({
        columnId: 1,
        type: 'pattern',
        pattern: 'sample_{i}',
        count: 5
      });

      spyOn(component.submit, 'emit');
      component.onSubmit();

      expect(component.submit.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        variations: jasmine.arrayContaining([
          jasmine.objectContaining({
            columnId: 1,
            type: 'pattern',
            pattern: 'sample_{i}',
            count: 5
          })
        ])
      }));
    });

    it('should not submit with empty template samples', () => {
      component.advancedForm.patchValue({
        templateSamples: '',
        targetSampleCount: 10,
        fillStrategy: 'cartesian_product'
      });

      component.addVariation('range');
      component.variations.at(0).patchValue({ columnId: 1 });

      spyOn(component.submit, 'emit');
      component.onSubmit();

      expect(component.submit.emit).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Variations', () => {
    it('should handle multiple variations correctly', () => {
      component.advancedForm.patchValue({
        templateSamples: '1,2',
        targetSampleCount: 50,
        fillStrategy: 'cartesian_product'
      });

      component.addVariation('range');
      component.variations.at(0).patchValue({
        columnId: 1,
        type: 'range',
        start: 1,
        end: 5
      });

      component.addVariation('list');
      component.variations.at(1).patchValue({
        columnId: 2,
        type: 'list',
        values: 'A, B, C'
      });

      spyOn(component.submit, 'emit');
      component.onSubmit();

      expect(component.submit.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        variations: jasmine.arrayContaining([
          jasmine.objectContaining({ type: 'range' }),
          jasmine.objectContaining({ type: 'list', values: ['A', 'B', 'C'] })
        ])
      }));
    });
  });
});
