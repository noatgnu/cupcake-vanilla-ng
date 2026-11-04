import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';
import { BillingRecordService } from './billing-record';
import { ServicePriceService } from './service-price';

const API = 'http://localhost:8000/api/v1';

describe('Requests sent to the CUPCAKE Salted Caramel backend', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: API } }
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('filters billing records by the date range and user the backend reads', () => {
    TestBed.inject(BillingRecordService)
      .getBillingRecords({ startDate: '2026-01-01', endDate: '2026-02-01', userId: 3 })
      .subscribe();
    const req = httpMock.expectOne(r => r.url === `${API}/billing-records/`);
    expect(req.request.params.get('start_date')).toBe('2026-01-01');
    expect(req.request.params.get('end_date')).toBe('2026-02-01');
    expect(req.request.params.get('user_id')).toBe('3');
    req.flush({ count: 0, results: [] });
  });

  it('reads the approved record from the approval response', () => {
    TestBed.inject(BillingRecordService).approveBillingRecord('7', {})
      .subscribe(result => expect(result.billingRecord.id).toBe('7'));
    httpMock.expectOne(`${API}/billing-records/7/approve/`)
      .flush({ message: 'ok', billing_record: { id: '7' } });
  });

  it('reads pending approvals as a list', () => {
    TestBed.inject(BillingRecordService).getPendingApproval()
      .subscribe(result => expect(result.length).toBe(1));
    httpMock.expectOne(`${API}/billing-records/pending_approval/`).flush([{ id: '1' }]);
  });

  it('reads the totals per cost centre', () => {
    TestBed.inject(BillingRecordService).getByCostCenter()
      .subscribe(result => expect(result[0]).toEqual({ costCenter: 'CC-1', recordCount: 2, totalAmount: 30 }));
    httpMock.expectOne(`${API}/billing-records/by_cost_center/`)
      .flush([{ cost_center: 'CC-1', record_count: 2, total_amount: 30 }]);
  });

  it('reads the quantities of a cost calculation', () => {
    TestBed.inject(ServicePriceService).calculateCost(4, { quantity: 3, applyBulkDiscount: true })
      .subscribe(result => expect(result.quantityBillable).toBe(3));
    const req = httpMock.expectOne(`${API}/service-prices/4/calculate_cost/`);
    expect(req.request.body).toEqual({ quantity: 3, apply_bulk_discount: true });
    req.flush({ quantity_requested: 3, quantity_billable: 3, unit_price: 10, subtotal: 30, setup_fee: 0, bulk_discount: 0, total: 30, currency: 'USD' });
  });
});
