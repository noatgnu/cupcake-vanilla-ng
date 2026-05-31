import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let activeModal: { close: jasmine.Spy; dismiss: jasmine.Spy };

  beforeEach(async () => {
    activeModal = { close: jasmine.createSpy('close'), dismiss: jasmine.createSpy('dismiss') };
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [{ provide: NgbActiveModal, useValue: activeModal }]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('confirm() closes modal with true', () => {
    component.confirm();
    expect(activeModal.close).toHaveBeenCalledWith(true);
  });

  it('cancel() dismisses modal with false', () => {
    component.cancel();
    expect(activeModal.dismiss).toHaveBeenCalledWith(false);
  });
});
