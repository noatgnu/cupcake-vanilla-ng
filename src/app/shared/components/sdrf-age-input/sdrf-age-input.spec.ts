import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SdrfAgeInput } from './sdrf-age-input';

describe('SdrfAgeInput', () => {
  let component: SdrfAgeInput;
  let fixture: ComponentFixture<SdrfAgeInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdrfAgeInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SdrfAgeInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
