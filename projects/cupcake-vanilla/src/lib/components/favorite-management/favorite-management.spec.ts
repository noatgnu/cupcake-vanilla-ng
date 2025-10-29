import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FavoriteManagement } from './favorite-management';

describe('FavoriteManagement', () => {
  let component: FavoriteManagement;
  let fixture: ComponentFixture<FavoriteManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FavoriteManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FavoriteManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
