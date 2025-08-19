import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnTemplates } from './column-templates';

describe('ColumnTemplates', () => {
  let component: ColumnTemplates;
  let fixture: ComponentFixture<ColumnTemplates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColumnTemplates]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColumnTemplates);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
