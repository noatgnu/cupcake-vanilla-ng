import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataTables } from './metadata-tables';

describe('MetadataTables', () => {
  let component: MetadataTables;
  let fixture: ComponentFixture<MetadataTables>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataTables]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataTables);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
