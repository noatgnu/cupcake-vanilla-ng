import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataTableDetails } from './metadata-table-details';

describe('MetadataTableDetails', () => {
  let component: MetadataTableDetails;
  let fixture: ComponentFixture<MetadataTableDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataTableDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataTableDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
