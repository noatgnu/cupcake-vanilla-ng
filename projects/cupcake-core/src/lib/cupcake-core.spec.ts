import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CupcakeCore } from './cupcake-core';

describe('CupcakeCore', () => {
  let component: CupcakeCore;
  let fixture: ComponentFixture<CupcakeCore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CupcakeCore]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CupcakeCore);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
