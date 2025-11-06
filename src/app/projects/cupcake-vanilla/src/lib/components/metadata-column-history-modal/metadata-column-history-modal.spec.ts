import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataColumnHistoryModal } from './metadata-column-history-modal';

describe('MetadataColumnHistoryModal', () => {
  let component: MetadataColumnHistoryModal;
  let fixture: ComponentFixture<MetadataColumnHistoryModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetadataColumnHistoryModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MetadataColumnHistoryModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
