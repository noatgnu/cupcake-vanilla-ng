import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DemoModeBannerComponent } from './demo-mode-banner';
import { DemoModeService } from '../../services/demo-mode';
import { BehaviorSubject } from 'rxjs';

describe('DemoModeBannerComponent', () => {
  let component: DemoModeBannerComponent;
  let fixture: ComponentFixture<DemoModeBannerComponent>;
  let demoModeService: jasmine.SpyObj<DemoModeService>;
  let demoModeSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    demoModeSubject = new BehaviorSubject({
      isActive: false,
      cleanupIntervalMinutes: 15
    });

    const demoModeSpy = jasmine.createSpyObj('DemoModeService', ['setDemoMode', 'isDemoMode', 'getDemoModeInfo'], {
      demoMode$: demoModeSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [DemoModeBannerComponent],
      providers: [
        { provide: DemoModeService, useValue: demoModeSpy }
      ]
    }).compileComponents();

    demoModeService = TestBed.inject(DemoModeService) as jasmine.SpyObj<DemoModeService>;
    fixture = TestBed.createComponent(DemoModeBannerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show banner when demo mode is inactive', () => {
    demoModeSubject.next({
      isActive: false,
      cleanupIntervalMinutes: 15
    });
    fixture.detectChanges();

    const bannerElement = fixture.nativeElement.querySelector('.demo-mode-banner');
    expect(bannerElement).toBeNull();
  });

  it('should show banner when demo mode is active', () => {
    demoModeSubject.next({
      isActive: true,
      cleanupIntervalMinutes: 15,
      lastDetected: new Date()
    });
    fixture.detectChanges();

    const bannerElement = fixture.nativeElement.querySelector('.demo-mode-banner');
    expect(bannerElement).toBeTruthy();
  });

  it('should display cleanup interval in banner', () => {
    demoModeSubject.next({
      isActive: true,
      cleanupIntervalMinutes: 20,
      lastDetected: new Date()
    });
    fixture.detectChanges();

    const bannerContent = fixture.nativeElement.textContent;
    expect(bannerContent).toContain('20 minutes');
  });

  it('should toggle collapse state', () => {
    demoModeSubject.next({
      isActive: true,
      cleanupIntervalMinutes: 15,
      lastDetected: new Date()
    });
    fixture.detectChanges();

    expect(component.isCollapsed).toBe(false);

    component.toggleCollapse();
    expect(component.isCollapsed).toBe(true);

    component.toggleCollapse();
    expect(component.isCollapsed).toBe(false);
  });

  it('should save collapse state to localStorage', () => {
    demoModeSubject.next({
      isActive: true,
      cleanupIntervalMinutes: 15,
      lastDetected: new Date()
    });
    fixture.detectChanges();

    spyOn(localStorage, 'setItem');

    component.toggleCollapse();
    expect(localStorage.setItem).toHaveBeenCalledWith('demo_banner_collapsed', 'true');

    component.toggleCollapse();
    expect(localStorage.setItem).toHaveBeenCalledWith('demo_banner_collapsed', 'false');
  });

  it('should load collapse state from localStorage on init', () => {
    spyOn(localStorage, 'getItem').and.returnValue('true');

    demoModeSubject.next({
      isActive: true,
      cleanupIntervalMinutes: 15,
      lastDetected: new Date()
    });

    component.ngOnInit();

    expect(component.isCollapsed).toBe(true);
  });

  it('should calculate minutes remaining correctly', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    demoModeSubject.next({
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

    demoModeSubject.next({
      isActive: true,
      cleanupIntervalMinutes: 15,
      lastDetected: twentyMinutesAgo
    });
    fixture.detectChanges();

    const remaining = component.getMinutesRemaining();
    expect(remaining).toBe(0);
  });

  it('should show default interval when lastDetected is not available', () => {
    demoModeSubject.next({
      isActive: true,
      cleanupIntervalMinutes: 15
    });
    fixture.detectChanges();

    const remaining = component.getMinutesRemaining();
    expect(remaining).toBe(15);
  });

  it('should unsubscribe on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});
