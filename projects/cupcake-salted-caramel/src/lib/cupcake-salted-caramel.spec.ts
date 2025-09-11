import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CupcakeSaltedCaramel } from './cupcake-salted-caramel';

describe('CupcakeSaltedCaramel', () => {
  let component: CupcakeSaltedCaramel;
  let fixture: ComponentFixture<CupcakeSaltedCaramel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CupcakeSaltedCaramel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CupcakeSaltedCaramel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
