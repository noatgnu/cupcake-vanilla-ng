import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataValueEditModal } from './metadata-value-edit-modal';

describe('MetadataValueEditModal', () => {
  let component: MetadataValueEditModal;
  let fixture: ComponentFixture<MetadataValueEditModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataValueEditModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataValueEditModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
