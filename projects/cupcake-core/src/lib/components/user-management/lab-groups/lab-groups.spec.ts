import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LabGroups } from './lab-groups';

describe('LabGroups', () => {
  let component: LabGroups;
  let fixture: ComponentFixture<LabGroups>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabGroups]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LabGroups);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
