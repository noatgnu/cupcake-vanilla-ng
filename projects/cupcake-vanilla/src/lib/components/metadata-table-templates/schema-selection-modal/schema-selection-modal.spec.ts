import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';
import { TemplateSchemaSelectionModal } from './schema-selection-modal';

describe('TemplateSchemaSelectionModal', () => {
  let component: TemplateSchemaSelectionModal;
  let fixture: ComponentFixture<TemplateSchemaSelectionModal>;
  const mockConfig = {
    apiUrl: 'https://api.test.com',
    siteName: 'Test Site'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TemplateSchemaSelectionModal,
        ReactiveFormsModule,
        HttpClientTestingModule
      ],
      providers: [
        NgbActiveModal,
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateSchemaSelectionModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
