import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SamplePoolDetailsModal } from './sample-pool-details-modal';

describe('SamplePoolDetailsModal', () => {
  let component: SamplePoolDetailsModal;
  let fixture: ComponentFixture<SamplePoolDetailsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SamplePoolDetailsModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SamplePoolDetailsModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
