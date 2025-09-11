import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CupcakeVanilla } from './cupcake-vanilla';

describe('CupcakeVanilla', () => {
  let component: CupcakeVanilla;
  let fixture: ComponentFixture<CupcakeVanilla>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CupcakeVanilla]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CupcakeVanilla);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
