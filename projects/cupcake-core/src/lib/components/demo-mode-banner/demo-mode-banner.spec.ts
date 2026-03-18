import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DemoModeBannerComponent } from './demo-mode-banner';
import { DemoModeService, DemoModeInfo } from '../../services/demo-mode';
import { signal } from '@angular/core';

describe('DemoModeBannerComponent', () => {
  let component: DemoModeBannerComponent;
  let fixture: ComponentFixture<DemoModeBannerComponent>;

  const mockDemoModeSignal = signal<DemoModeInfo>({
    isActive: false,
    cleanupIntervalMinutes: 15
  });

  beforeEach(async () => {
    const demoModeSpy = jasmine.createSpyObj('DemoModeService', [], {
      demoMode: mockDemoModeSignal
    });

    await TestBed.configureTestingModule({
      imports: [DemoModeBannerComponent],
      providers: [
        { provide: DemoModeService, useValue: demoModeSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DemoModeBannerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle collapse state', () => {
    mockDemoModeSignal.set({
      isActive: true,
      cleanupIntervalMinutes: 15,
      lastDetected: new Date()
    });
    fixture.detectChanges();

    expect(component.isCollapsed()).toBe(false);

    component.toggleCollapse();
    expect(component.isCollapsed()).toBe(true);

    component.toggleCollapse();
    expect(component.isCollapsed()).toBe(false);
  });

  it('should calculate minutes remaining correctly', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    mockDemoModeSignal.set({
      isActive: true,
      cleanupIntervalMinutes: 15,
      lastDetected: fiveMinutesAgo
    });
    fixture.detectChanges();

    const remaining = component.getMinutesRemaining();
    expect(remaining).toBeGreaterThanOrEqual(9);
    expect(remaining).toBeLessThanOrEqual(10);
  });

  it('should not show negative minutes remaining', () => {
    const now = new Date();
    const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);

    mockDemoModeSignal.set({
      isActive: true,
      cleanupIntervalMinutes: 15,
      lastDetected: twentyMinutesAgo
    });
    fixture.detectChanges();

    const remaining = component.getMinutesRemaining();
    expect(remaining).toBe(0);
  });

  it('should show default interval when lastDetected is not available', () => {
    mockDemoModeSignal.set({
      isActive: true,
      cleanupIntervalMinutes: 15
    });
    fixture.detectChanges();

    const remaining = component.getMinutesRemaining();
    expect(remaining).toBe(15);
  });
});
