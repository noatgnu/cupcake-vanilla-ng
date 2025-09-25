import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableCreationModal } from './table-creation-modal';

describe('TableCreationModal', () => {
  let component: TableCreationModal;
  let fixture: ComponentFixture<TableCreationModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCreationModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableCreationModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
