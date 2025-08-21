import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SdrfModificationInput } from './sdrf-modification-input';

describe('SdrfModificationInput', () => {
  let component: SdrfModificationInput;
  let fixture: ComponentFixture<SdrfModificationInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdrfModificationInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SdrfModificationInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
