import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColumnEditModal } from './column-edit-modal';

describe('ColumnEditModal', () => {
  let component: ColumnEditModal;
  let fixture: ComponentFixture<ColumnEditModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColumnEditModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ColumnEditModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
