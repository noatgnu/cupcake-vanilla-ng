import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { OpenInExcel } from './open-in-excel';
import { ExcelLaunchService } from '../../services/excel-launch';
import { ExcelLaunchCode } from '../../models';

describe('OpenInExcel', () => {
  let component: OpenInExcel;
  let fixture: ComponentFixture<OpenInExcel>;
  let launchService: jasmine.SpyObj<ExcelLaunchService>;

  const mockLaunchCode: ExcelLaunchCode = {
    code: 'ABC123XYZ',
    tableId: 123,
    tableName: 'Test Table',
    expiresIn: 300
  };

  beforeEach(async () => {
    const launchServiceSpy = jasmine.createSpyObj('ExcelLaunchService', ['createLaunchCode']);

    await TestBed.configureTestingModule({
      imports: [OpenInExcel],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ExcelLaunchService, useValue: launchServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OpenInExcel);
    component = fixture.componentInstance;
    launchService = TestBed.inject(ExcelLaunchService) as jasmine.SpyObj<ExcelLaunchService>;

    fixture.componentRef.setInput('tableId', 123);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('createLaunchCode', () => {
    it('should create launch code and show modal', fakeAsync(() => {
      launchService.createLaunchCode.and.returnValue(of(mockLaunchCode));

      component.createLaunchCode();
      tick();

      expect(launchService.createLaunchCode).toHaveBeenCalledWith({
        tableId: 123,
        tableName: ''
      });
      expect(component.launchCode()).toEqual(mockLaunchCode);
      expect(component.showModal()).toBeTrue();
      expect(component.isLoading()).toBeFalse();
    }));

    it('should emit launched event on success', fakeAsync(() => {
      launchService.createLaunchCode.and.returnValue(of(mockLaunchCode));
      const launchedSpy = jasmine.createSpy('launched');
      component.launched.subscribe(launchedSpy);

      component.createLaunchCode();
      tick();

      expect(launchedSpy).toHaveBeenCalledWith(mockLaunchCode);
    }));

    it('should set loading state while creating', () => {
      launchService.createLaunchCode.and.returnValue(of(mockLaunchCode));

      component.createLaunchCode();
      expect(component.isLoading()).toBeTrue();
    });

    it('should emit error on failure', fakeAsync(() => {
      const errorResponse = { error: { detail: 'Table not found' } };
      launchService.createLaunchCode.and.returnValue(throwError(() => errorResponse));
      const errorSpy = jasmine.createSpy('error');
      component.error.subscribe(errorSpy);

      component.createLaunchCode();
      tick();

      expect(errorSpy).toHaveBeenCalledWith('Table not found');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should use default error message when detail not provided', fakeAsync(() => {
      launchService.createLaunchCode.and.returnValue(throwError(() => ({ error: {} })));
      const errorSpy = jasmine.createSpy('error');
      component.error.subscribe(errorSpy);

      component.createLaunchCode();
      tick();

      expect(errorSpy).toHaveBeenCalledWith('Failed to create launch code');
    }));
  });

  describe('copyCode', () => {
    beforeEach(() => {
      component.launchCode.set(mockLaunchCode);
    });

    it('should copy code to clipboard', fakeAsync(() => {
      const mockClipboard = {
        writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve())
      };
      Object.defineProperty(navigator, 'clipboard', { value: mockClipboard, configurable: true });

      component.copyCode();
      tick();

      expect(mockClipboard.writeText).toHaveBeenCalledWith('ABC123XYZ');
      expect(component.copySuccess()).toBeTrue();

      tick(2000);
      expect(component.copySuccess()).toBeFalse();
    }));

    it('should not copy if no launch code', () => {
      component.launchCode.set(null);
      const mockClipboard = {
        writeText: jasmine.createSpy('writeText').and.returnValue(Promise.resolve())
      };
      Object.defineProperty(navigator, 'clipboard', { value: mockClipboard, configurable: true });

      component.copyCode();

      expect(mockClipboard.writeText).not.toHaveBeenCalled();
    });
  });

  describe('closeModal', () => {
    it('should close modal and clear launch code', () => {
      component.showModal.set(true);
      component.launchCode.set(mockLaunchCode);

      component.closeModal();

      expect(component.showModal()).toBeFalse();
      expect(component.launchCode()).toBeNull();
    });
  });

  describe('getExpiryTime', () => {
    it('should return formatted expiry time for 5 minutes', () => {
      component.launchCode.set(mockLaunchCode);
      expect(component.getExpiryTime()).toBe('5 minutes');
    });

    it('should return singular for 1 minute', () => {
      component.launchCode.set({ ...mockLaunchCode, expiresIn: 60 });
      expect(component.getExpiryTime()).toBe('1 minute');
    });

    it('should round up partial minutes', () => {
      component.launchCode.set({ ...mockLaunchCode, expiresIn: 90 });
      expect(component.getExpiryTime()).toBe('2 minutes');
    });

    it('should return empty string when no launch code', () => {
      component.launchCode.set(null);
      expect(component.getExpiryTime()).toBe('');
    });

    it('should return empty string when expiresIn is 0', () => {
      component.launchCode.set({ ...mockLaunchCode, expiresIn: 0 });
      expect(component.getExpiryTime()).toBe('');
    });
  });

  describe('inputs', () => {
    it('should use custom button class', () => {
      fixture.componentRef.setInput('buttonClass', 'btn btn-primary');
      fixture.detectChanges();
      expect(component.buttonClass()).toBe('btn btn-primary');
    });

    it('should use custom button text', () => {
      fixture.componentRef.setInput('buttonText', 'Export to Excel');
      fixture.detectChanges();
      expect(component.buttonText()).toBe('Export to Excel');
    });

    it('should pass table name to service', fakeAsync(() => {
      fixture.componentRef.setInput('tableName', 'My Table');
      launchService.createLaunchCode.and.returnValue(of(mockLaunchCode));

      component.createLaunchCode();
      tick();

      expect(launchService.createLaunchCode).toHaveBeenCalledWith({
        tableId: 123,
        tableName: 'My Table'
      });
    }));
  });
});
