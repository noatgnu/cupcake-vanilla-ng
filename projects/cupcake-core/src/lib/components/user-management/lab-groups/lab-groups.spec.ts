import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUPCAKE_CORE_CONFIG } from '../../../services/auth';
import { LabGroupsComponent } from './lab-groups';

describe('LabGroupsComponent', () => {
  let component: LabGroupsComponent;
  let fixture: ComponentFixture<LabGroupsComponent>;
  const mockConfig = {
    apiUrl: 'https://api.test.com',
    siteName: 'Test Site'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabGroupsComponent, HttpClientTestingModule],
      providers: [
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LabGroupsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
