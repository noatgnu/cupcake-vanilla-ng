import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';
import { ExcelExportModalComponent } from './excel-export-modal';

describe('ExcelExportModalComponent', () => {
  let component: ExcelExportModalComponent;
  let fixture: ComponentFixture<ExcelExportModalComponent>;
  const mockConfig = {
    apiUrl: 'https://api.test.com',
    siteName: 'Test Site'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExcelExportModalComponent, HttpClientTestingModule],
      providers: [
        NgbActiveModal,
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExcelExportModalComponent);
    component = fixture.componentInstance;
    component.metadataTableId = 1;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
