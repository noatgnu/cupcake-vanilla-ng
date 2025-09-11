import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CupcakeMintChocolate } from './cupcake-mint-chocolate';

describe('CupcakeMintChocolate', () => {
  let component: CupcakeMintChocolate;
  let fixture: ComponentFixture<CupcakeMintChocolate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CupcakeMintChocolate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CupcakeMintChocolate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
