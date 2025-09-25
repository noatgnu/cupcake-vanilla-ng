import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataTableTemplates } from './metadata-table-templates';

describe('MetadataTableTemplates', () => {
  let component: MetadataTableTemplates;
  let fixture: ComponentFixture<MetadataTableTemplates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataTableTemplates]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataTableTemplates);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
