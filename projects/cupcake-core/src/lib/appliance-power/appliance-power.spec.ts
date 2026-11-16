import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';

import { ApplianceService } from '../services/appliance';
import { AuthService } from '../services/auth';
import { ConfirmDialogService } from '../services/confirm-dialog';
import { ToastService } from '../services/toast';
import { AppliancePower } from './appliance-power';

describe('AppliancePower', () => {
  let component: AppliancePower;
  let fixture: ComponentFixture<AppliancePower>;
  let appliance: jasmine.SpyObj<ApplianceService>;
  let confirmDialog: jasmine.SpyObj<ConfirmDialogService>;
  let toast: jasmine.SpyObj<ToastService>;
  const currentUser = signal<any>({ isSuperuser: true });

  beforeEach(async () => {
    currentUser.set({ isSuperuser: true });
    appliance = jasmine.createSpyObj('ApplianceService', ['power', 'getNetworkInfo']);
    appliance.power.and.returnValue(of({ message: 'scheduled' }));
    confirmDialog = jasmine.createSpyObj('ConfirmDialogService', ['confirm']);
    confirmDialog.confirm.and.resolveTo(true);
    toast = jasmine.createSpyObj('ToastService', ['info', 'success', 'error']);
    await TestBed.configureTestingModule({
      imports: [AppliancePower],
      providers: [
        { provide: ApplianceService, useValue: appliance },
        { provide: AuthService, useValue: { currentUser } },
        { provide: ConfirmDialogService, useValue: confirmDialog },
        { provide: ToastService, useValue: toast }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(AppliancePower);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function button(action: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(`button[data-action="${action}"]`);
  }

  it('offers restarting the backend, restarting the appliance and shutting it down', () => {
    expect(['restart-backend', 'reboot', 'shutdown'].map(action => !!button(action))).toEqual([true, true, true]);
  });

  it('disables the actions for anyone but a superuser and says why', () => {
    currentUser.set({ isSuperuser: false, isStaff: true });
    fixture.detectChanges();
    expect(button('reboot').disabled).toBeTrue();
    expect(button('reboot').title).toBe('Only superusers can restart or shut down the appliance');
  });

  it('sends nothing when the confirmation is cancelled', async () => {
    confirmDialog.confirm.and.resolveTo(false);
    await component.run(component.options[1]);
    expect(appliance.power).not.toHaveBeenCalled();
    expect(component.state()).toBe('idle');
  });

  it('waits for the appliance to go down and answer again after a restart', async () => {
    let calls = 0;
    appliance.getNetworkInfo.and.callFake(() => (++calls === 1 ? throwError(() => ({ status: 0 })) : of({ hostname: 'cupcake', addresses: [] })));
    jasmine.clock().install();
    try {
      await component.run(component.options[1]);
      expect(appliance.power).toHaveBeenCalledWith('reboot');
      expect(component.state()).toBe('waiting');
      jasmine.clock().tick(8000);
      expect(component.state()).toBe('waiting');
      jasmine.clock().tick(4000);
      expect(component.state()).toBe('back');
      expect(toast.success).toHaveBeenCalled();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('shows the appliance as shutting down after a shutdown', async () => {
    await component.run(component.options[2]);
    expect(appliance.power).toHaveBeenCalledWith('shutdown');
    expect(component.state()).toBe('off');
    fixture.detectChanges();
    expect(button('reboot').disabled).toBeTrue();
  });

  it('reports a refused or failed action', async () => {
    appliance.power.and.returnValue(throwError(() => ({ error: { detail: 'Only superusers can restart or shut down the appliance.' } })));
    await component.run(component.options[0]);
    expect(component.state()).toBe('idle');
    expect(toast.error).toHaveBeenCalledWith('Only superusers can restart or shut down the appliance.');
  });
});
