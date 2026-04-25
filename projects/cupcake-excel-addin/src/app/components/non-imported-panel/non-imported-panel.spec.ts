import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NonImportedPanel } from './non-imported-panel';

describe('NonImportedPanel', () => {
  let component: NonImportedPanel;
  let fixture: ComponentFixture<NonImportedPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NonImportedPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NonImportedPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
