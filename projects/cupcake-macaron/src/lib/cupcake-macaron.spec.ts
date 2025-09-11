import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CupcakeMacaron } from './cupcake-macaron';

describe('CupcakeMacaron', () => {
  let component: CupcakeMacaron;
  let fixture: ComponentFixture<CupcakeMacaron>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CupcakeMacaron]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CupcakeMacaron);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
