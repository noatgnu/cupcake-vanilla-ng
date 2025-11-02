import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SamplePoolCreateModal } from './sample-pool-create-modal';

describe('SamplePoolCreateModal', () => {
  let component: SamplePoolCreateModal;
  let fixture: ComponentFixture<SamplePoolCreateModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SamplePoolCreateModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SamplePoolCreateModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
