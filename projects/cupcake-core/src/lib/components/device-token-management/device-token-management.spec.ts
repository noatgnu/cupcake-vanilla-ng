import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceTokenManagement } from './device-token-management';

describe('DeviceTokenManagement', () => {
  let component: DeviceTokenManagement;
  let fixture: ComponentFixture<DeviceTokenManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceTokenManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeviceTokenManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
