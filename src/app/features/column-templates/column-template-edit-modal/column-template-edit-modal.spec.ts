import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnTemplateEditModal } from './column-template-edit-modal';

describe('ColumnTemplateEditModal', () => {
  let component: ColumnTemplateEditModal;
  let fixture: ComponentFixture<ColumnTemplateEditModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColumnTemplateEditModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColumnTemplateEditModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
