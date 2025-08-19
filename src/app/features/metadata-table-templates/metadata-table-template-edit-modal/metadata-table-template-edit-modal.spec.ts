import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataTableTemplateEditModal } from './metadata-table-template-edit-modal';

describe('MetadataTableTemplateEditModal', () => {
  let component: MetadataTableTemplateEditModal;
  let fixture: ComponentFixture<MetadataTableTemplateEditModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataTableTemplateEditModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataTableTemplateEditModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
