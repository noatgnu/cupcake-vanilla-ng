import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SamplePoolEditModal } from './sample-pool-edit-modal';

describe('SamplePoolEditModal', () => {
  let component: SamplePoolEditModal;
  let fixture: ComponentFixture<SamplePoolEditModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SamplePoolEditModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SamplePoolEditModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
