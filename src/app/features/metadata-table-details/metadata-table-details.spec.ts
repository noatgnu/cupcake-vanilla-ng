import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataTableDetailsComponent } from './metadata-table-details';

describe('MetadataTableDetailsComponent', () => {
  let component: MetadataTableDetailsComponent;
  let fixture: ComponentFixture<MetadataTableDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataTableDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataTableDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
