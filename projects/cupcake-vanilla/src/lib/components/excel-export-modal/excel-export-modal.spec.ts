import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcelExportModal } from './excel-export-modal';

describe('ExcelExportModal', () => {
  let component: ExcelExportModal;
  let fixture: ComponentFixture<ExcelExportModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExcelExportModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExcelExportModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
