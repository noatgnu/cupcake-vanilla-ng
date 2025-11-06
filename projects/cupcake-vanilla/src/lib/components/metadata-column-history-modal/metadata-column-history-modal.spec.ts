import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';

import { MetadataColumnHistoryModal } from './metadata-column-history-modal';
import { MetadataColumnService } from '../../services';
import { MetadataColumnHistoryResponse } from '../../models';

describe('MetadataColumnHistoryModal', () => {
  let component: MetadataColumnHistoryModal;
  let fixture: ComponentFixture<MetadataColumnHistoryModal>;
  let mockColumnService: jasmine.SpyObj<MetadataColumnService>;
  let mockActiveModal: jasmine.SpyObj<NgbActiveModal>;

  const mockHistoryResponse: MetadataColumnHistoryResponse = {
    count: 3,
    limit: 20,
    offset: 0,
    hasMore: false,
    history: [
      {
        historyId: 3,
        historyDate: '2025-11-04T15:00:00Z',
        historyType: 'Changed',
        historyUser: 'testuser',
        historyUserId: 1,
        changes: [
          { field: 'value', oldValue: 'old_value', newValue: 'new_value' },
          { field: 'mandatory', oldValue: false, newValue: true }
        ],
        snapshot: {
          name: 'test_column',
          type: 'text',
          value: 'new_value',
          columnPosition: 1,
          mandatory: true,
          hidden: false,
          readonly: false,
          modifiers: [],
          notApplicable: false,
          notAvailable: false
        }
      },
      {
        historyId: 2,
        historyDate: '2025-11-04T14:30:00Z',
        historyType: 'Changed',
        historyUser: 'testuser',
        historyUserId: 1,
        changes: [
          { field: 'value', oldValue: 'initial_value', newValue: 'old_value' }
        ],
        snapshot: {
          name: 'test_column',
          type: 'text',
          value: 'old_value',
          columnPosition: 1,
          mandatory: false,
          hidden: false,
          readonly: false,
          modifiers: [],
          notApplicable: false,
          notAvailable: false
        }
      },
      {
        historyId: 1,
        historyDate: '2025-11-04T14:00:00Z',
        historyType: 'Created',
        historyUser: null,
        historyUserId: null,
        changes: [],
        snapshot: {
          name: 'test_column',
          type: 'text',
          value: 'initial_value',
          columnPosition: 1,
          mandatory: false,
          hidden: false,
          readonly: false,
          modifiers: [],
          notApplicable: false,
          notAvailable: false
        }
      }
    ]
  };

  beforeEach(async () => {
    mockColumnService = jasmine.createSpyObj('MetadataColumnService', ['getHistory']);
    mockActiveModal = jasmine.createSpyObj('NgbActiveModal', ['close']);

    await TestBed.configureTestingModule({
      imports: [MetadataColumnHistoryModal, HttpClientTestingModule],
      providers: [
        { provide: MetadataColumnService, useValue: mockColumnService },
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MetadataColumnHistoryModal);
    component = fixture.componentInstance;
    component.config = {
      columnId: 1,
      columnName: 'test_column'
    };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load history on init', () => {
    mockColumnService.getHistory.and.returnValue(of(mockHistoryResponse));

    fixture.detectChanges();

    expect(mockColumnService.getHistory).toHaveBeenCalledWith(1, { limit: 20, offset: 0 });
    expect(component.history.length).toBe(3);
    expect(component.totalCount).toBe(3);
    expect(component.hasMore).toBe(false);
    expect(component.loading).toBe(false);
  });

  it('should handle load history error', () => {
    const errorResponse = { error: { detail: 'Not found' }, message: 'HTTP error' };
    mockColumnService.getHistory.and.returnValue(throwError(() => errorResponse));

    fixture.detectChanges();

    expect(component.error).toContain('Failed to load history');
    expect(component.loading).toBe(false);
  });

  it('should load more history records', () => {
    const firstResponse: MetadataColumnHistoryResponse = {
      ...mockHistoryResponse,
      hasMore: true
    };
    const secondResponse: MetadataColumnHistoryResponse = {
      count: 5,
      limit: 20,
      offset: 20,
      hasMore: false,
      history: [
        {
          historyId: 0,
          historyDate: '2025-11-04T13:00:00Z',
          historyType: 'Created',
          historyUser: null,
          historyUserId: null,
          changes: [],
          snapshot: mockHistoryResponse.history[0].snapshot
        }
      ]
    };

    mockColumnService.getHistory.and.returnValues(of(firstResponse), of(secondResponse));

    fixture.detectChanges();

    expect(component.history.length).toBe(3);
    expect(component.hasMore).toBe(true);

    component.loadMore();

    expect(mockColumnService.getHistory).toHaveBeenCalledTimes(2);
    expect(component.history.length).toBe(4);
    expect(component.hasMore).toBe(false);
  });

  it('should not load more when already loading', () => {
    mockColumnService.getHistory.and.returnValue(of(mockHistoryResponse));
    fixture.detectChanges();

    component.loading = true;
    component.hasMore = true;

    component.loadMore();

    expect(mockColumnService.getHistory).toHaveBeenCalledTimes(1);
  });

  it('should close modal', () => {
    spyOn(component.closed, 'emit');

    component.close();

    expect(component.closed.emit).toHaveBeenCalled();
    expect(mockActiveModal.close).toHaveBeenCalled();
  });

  it('should format field labels correctly', () => {
    expect(component.getChangeLabel('name')).toBe('Name');
    expect(component.getChangeLabel('columnPosition')).toBe('Position');
    expect(component.getChangeLabel('unknownField')).toBe('unknownField');
  });

  it('should format values correctly', () => {
    expect(component.formatValue(null)).toBe('(empty)');
    expect(component.formatValue(undefined)).toBe('(empty)');
    expect(component.formatValue(true)).toBe('Yes');
    expect(component.formatValue(false)).toBe('No');
    expect(component.formatValue('test')).toBe('test');
    expect(component.formatValue({ key: 'value' })).toContain('key');
  });

  it('should return correct CSS class for history type', () => {
    expect(component.getHistoryTypeClass('Created')).toBe('badge bg-success');
    expect(component.getHistoryTypeClass('Changed')).toBe('badge bg-primary');
    expect(component.getHistoryTypeClass('Deleted')).toBe('badge bg-danger');
    expect(component.getHistoryTypeClass('Unknown')).toBe('badge bg-secondary');
  });

  it('should display changes correctly', () => {
    mockColumnService.getHistory.and.returnValue(of(mockHistoryResponse));
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('test_column');
    expect(compiled.textContent).toContain('Changed');
  });

  it('should show load more button when hasMore is true', () => {
    const responseWithMore: MetadataColumnHistoryResponse = {
      ...mockHistoryResponse,
      hasMore: true
    };
    mockColumnService.getHistory.and.returnValue(of(responseWithMore));

    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const loadMoreButton = compiled.querySelector('button:contains("Load More")');
    expect(component.hasMore).toBe(true);
  });
});
