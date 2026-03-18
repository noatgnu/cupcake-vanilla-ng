import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';
import { MetadataTableDetails } from './metadata-table-details';

describe('MetadataTableDetails', () => {
  let component: MetadataTableDetails;
  let fixture: ComponentFixture<MetadataTableDetails>;
  const mockConfig = {
    apiUrl: 'https://api.test.com',
    siteName: 'Test Site'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MetadataTableDetails,
        RouterTestingModule,
        HttpClientTestingModule,
        NgbModule
      ],
      providers: [
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MetadataTableDetails);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
