import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportedTablePanel } from './imported-table-panel';

describe('ImportedTablePanel', () => {
  let component: ImportedTablePanel;
  let fixture: ComponentFixture<ImportedTablePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportedTablePanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportedTablePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
