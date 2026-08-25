import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MetadataTableService } from '@noatgnu/cupcake-vanilla';
import { SharedTableComponent } from './shared-table';

describe('SharedTableComponent', () => {
  let component: SharedTableComponent;
  let fixture: ComponentFixture<SharedTableComponent>;

  const mockRoute = {
    snapshot: { paramMap: { get: () => null } }
  };

  const mockMetadataTableService = {
    getSharedTable: jasmine.createSpy('getSharedTable').and.returnValue(of(null))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedTableComponent],
      providers: [
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: MetadataTableService, useValue: mockMetadataTableService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SharedTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
