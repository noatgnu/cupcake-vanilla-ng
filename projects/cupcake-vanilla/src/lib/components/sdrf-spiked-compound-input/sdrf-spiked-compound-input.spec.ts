import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SdrfSpikedCompoundInput } from './sdrf-spiked-compound-input';

describe('SdrfSpikedCompoundInput', () => {
  let component: SdrfSpikedCompoundInput;
  let fixture: ComponentFixture<SdrfSpikedCompoundInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdrfSpikedCompoundInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SdrfSpikedCompoundInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
