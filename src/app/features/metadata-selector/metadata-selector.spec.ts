import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataSelector } from './metadata-selector';

describe('MetadataSelector', () => {
  let component: MetadataSelector;
  let fixture: ComponentFixture<MetadataSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
