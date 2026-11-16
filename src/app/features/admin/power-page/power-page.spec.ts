import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';
import { PowerPage } from './power-page';

describe('PowerPage', () => {
  let component: PowerPage;
  let fixture: ComponentFixture<PowerPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PowerPage],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: 'http://localhost:8000/api' } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PowerPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('shows the appliance power actions', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('ccc-appliance-power button[data-action]').length).toBe(3);
  });
});
