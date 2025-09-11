import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CupcakeRedVelvet } from './cupcake-red-velvet';

describe('CupcakeRedVelvet', () => {
  let component: CupcakeRedVelvet;
  let fixture: ComponentFixture<CupcakeRedVelvet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CupcakeRedVelvet]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CupcakeRedVelvet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
