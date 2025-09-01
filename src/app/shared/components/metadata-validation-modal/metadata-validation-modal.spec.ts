import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';

import { MetadataValidationModal } from './metadata-validation-modal';
import { AsyncTaskService } from '../../services/async-task';
import { ToastService } from '../../services/toast';
import { ValidationTaskCreateRequest, MetadataValidationConfig } from '../../models/async-task';

describe('MetadataValidationModal', () => {
  let component: MetadataValidationModal;
  let fixture: ComponentFixture<MetadataValidationModal>;
  let mockActiveModal: jasmine.SpyObj<NgbActiveModal>;
  let mockAsyncTaskService: jasmine.SpyObj<AsyncTaskService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  const mockConfig: MetadataValidationConfig = {
    metadata_table_id: 123,
    metadata_table_name: 'Test Table'
  };

  beforeEach(async () => {
    mockActiveModal = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);
    mockAsyncTaskService = jasmine.createSpyObj('AsyncTaskService', ['validateMetadataTable']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [
        MetadataValidationModal,
        ReactiveFormsModule,
        NgbModule
      ],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal },
        { provide: AsyncTaskService, useValue: mockAsyncTaskService },
        { provide: ToastService, useValue: mockToastService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MetadataValidationModal);
    component = fixture.componentInstance;
    component.config = mockConfig;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.validationForm.get('validate_sdrf_format')?.value).toBe(true);
  });

  it('should display table name in alert', () => {
    const alertElement = fixture.nativeElement.querySelector('.alert-info strong');
    expect(alertElement.textContent).toBe('Test Table');
  });

  it('should disable submit button when form is invalid', () => {
    component.validationForm.patchValue({ validate_sdrf_format: false });
    component.validationForm.get('validate_sdrf_format')?.setErrors({ required: true });
    fixture.detectChanges();

    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(submitButton.disabled).toBe(true);
  });

  it('should call dismiss when cancel button is clicked', () => {
    const cancelButton = fixture.nativeElement.querySelector('button[type="button"]:not(.btn-close)');
    cancelButton.click();

    expect(mockActiveModal.dismiss).toHaveBeenCalled();
  });

  it('should call dismiss when close button is clicked', () => {
    const closeButton = fixture.nativeElement.querySelector('.btn-close');
    closeButton.click();

    expect(mockActiveModal.dismiss).toHaveBeenCalled();
  });

  it('should submit validation request successfully', () => {
    const mockResponse = {
      task_id: 'task-123',
      message: 'Validation started'
    };
    mockAsyncTaskService.validateMetadataTable.and.returnValue(of(mockResponse));

    component.onSubmit();

    expect(component.isValidating()).toBe(true);
    expect(mockAsyncTaskService.validateMetadataTable).toHaveBeenCalledWith({
      metadata_table_id: 123,
      validate_sdrf_format: true
    } as ValidationTaskCreateRequest);
    
    expect(mockToastService.success).toHaveBeenCalledWith(
      'Validation started successfully for "Test Table"'
    );
    expect(mockActiveModal.close).toHaveBeenCalledWith({
      success: true,
      task_id: 'task-123',
      message: 'Validation started'
    });
  });

  it('should handle validation error', () => {
    const mockError = {
      error: { error: 'Validation failed' }
    };
    mockAsyncTaskService.validateMetadataTable.and.returnValue(throwError(() => mockError));

    component.onSubmit();

    expect(component.isValidating()).toBe(false);
    expect(component.validationError()).toBe('Validation failed');
    expect(mockToastService.error).toHaveBeenCalledWith('Validation failed: Validation failed');
    expect(mockActiveModal.close).not.toHaveBeenCalled();
  });

  it('should handle validation error with default message', () => {
    const mockError = {};
    mockAsyncTaskService.validateMetadataTable.and.returnValue(throwError(() => mockError));

    component.onSubmit();

    expect(component.validationError()).toBe('Failed to start validation');
    expect(mockToastService.error).toHaveBeenCalledWith('Validation failed: Failed to start validation');
  });

  it('should not submit when form is invalid', () => {
    component.validationForm.get('validate_sdrf_format')?.setErrors({ required: true });

    component.onSubmit();

    expect(mockAsyncTaskService.validateMetadataTable).not.toHaveBeenCalled();
    expect(component.isValidating()).toBe(false);
  });

  it('should not submit when config is missing', () => {
    component.config = undefined;

    component.onSubmit();

    expect(mockAsyncTaskService.validateMetadataTable).not.toHaveBeenCalled();
    expect(component.isValidating()).toBe(false);
  });

  it('should disable buttons when validating', () => {
    component.isValidating.set(true);
    fixture.detectChanges();

    const cancelButton = fixture.nativeElement.querySelector('button[type="button"]:not(.btn-close)');
    const closeButton = fixture.nativeElement.querySelector('.btn-close');
    const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');

    expect(cancelButton.disabled).toBe(true);
    expect(closeButton.disabled).toBe(true);
    expect(submitButton.disabled).toBe(true);
  });

  it('should show spinner when validating', () => {
    component.isValidating.set(true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.spinner-border');
    expect(spinner).toBeTruthy();

    const submitButtonText = fixture.nativeElement.querySelector('button[type="submit"]').textContent.trim();
    expect(submitButtonText).toContain('Starting Validation...');
  });

  it('should display validation error when present', () => {
    component.validationError.set('Test error message');
    fixture.detectChanges();

    const errorAlert = fixture.nativeElement.querySelector('.alert-danger');
    expect(errorAlert).toBeTruthy();
    expect(errorAlert.textContent).toContain('Test error message');
  });

  it('should use correct form control values in submission', () => {
    mockAsyncTaskService.validateMetadataTable.and.returnValue(of({
      task_id: 'task-123',
      message: 'Success'
    }));

    component.validationForm.patchValue({
      validate_sdrf_format: false
    });

    component.onSubmit();

    expect(mockAsyncTaskService.validateMetadataTable).toHaveBeenCalledWith({
      metadata_table_id: 123,
      validate_sdrf_format: false
    } as ValidationTaskCreateRequest);
  });
});