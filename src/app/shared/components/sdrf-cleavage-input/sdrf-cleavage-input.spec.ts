import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SdrfCleavageInput } from './sdrf-cleavage-input';

describe('SdrfCleavageInput', () => {
  let component: SdrfCleavageInput;
  let fixture: ComponentFixture<SdrfCleavageInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdrfCleavageInput]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SdrfCleavageInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
