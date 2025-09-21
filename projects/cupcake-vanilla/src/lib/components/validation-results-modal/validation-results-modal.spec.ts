import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidationResultsModal } from './validation-results-modal';

describe('ValidationResultsModal', () => {
  let component: ValidationResultsModal;
  let fixture: ComponentFixture<ValidationResultsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidationResultsModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidationResultsModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
