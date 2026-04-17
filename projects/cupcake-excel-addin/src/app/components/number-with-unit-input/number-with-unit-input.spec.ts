import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumberWithUnitInput } from './number-with-unit-input';

describe('NumberWithUnitInput', () => {
  let component: NumberWithUnitInput;
  let fixture: ComponentFixture<NumberWithUnitInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberWithUnitInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NumberWithUnitInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
