import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchemaSelectionModal } from './schema-selection-modal';

describe('SchemaSelectionModal', () => {
  let component: SchemaSelectionModal;
  let fixture: ComponentFixture<SchemaSelectionModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchemaSelectionModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SchemaSelectionModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
