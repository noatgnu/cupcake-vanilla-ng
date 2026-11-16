import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { MaintenanceService } from '../services/maintenance';
import { MaintenanceOverlay } from './maintenance-overlay';

describe('MaintenanceOverlay', () => {
  let fixture: ComponentFixture<MaintenanceOverlay>;
  const active = signal(false);
  const reason = signal<'restarting' | 'unreachable'>('restarting');

  beforeEach(async () => {
    active.set(false);
    reason.set('restarting');
    await TestBed.configureTestingModule({
      imports: [MaintenanceOverlay],
      providers: [{ provide: MaintenanceService, useValue: { active, reason } }]
    }).compileComponents();
    fixture = TestBed.createComponent(MaintenanceOverlay);
    fixture.detectChanges();
  });

  it('shows nothing while the backend answers', () => {
    expect(fixture.nativeElement.querySelector('.maintenance-overlay')).toBeNull();
  });

  it('covers the page while the backend restarts', () => {
    active.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.maintenance-overlay h5').textContent).toContain('Cupcake is restarting');
  });

  it('says when the appliance cannot be reached at all', () => {
    active.set(true);
    reason.set('unreachable');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.maintenance-overlay h5').textContent).toContain('Cupcake cannot be reached');
  });
});
