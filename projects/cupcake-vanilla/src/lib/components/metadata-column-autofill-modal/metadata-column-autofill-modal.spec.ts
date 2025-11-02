import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataColumnAutofillModal } from './metadata-column-autofill-modal';

describe('MetadataColumnAutofillModal', () => {
  let component: MetadataColumnAutofillModal;
  let fixture: ComponentFixture<MetadataColumnAutofillModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataColumnAutofillModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataColumnAutofillModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
