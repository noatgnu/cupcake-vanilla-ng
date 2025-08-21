import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataTableEditModal } from './metadata-table-edit-modal';

describe('MetadataTableEditModal', () => {
  let component: MetadataTableEditModal;
  let fixture: ComponentFixture<MetadataTableEditModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataTableEditModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataTableEditModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
