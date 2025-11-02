import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchReplaceModal } from './search-replace-modal';

describe('SearchReplaceModal', () => {
  let component: SearchReplaceModal;
  let fixture: ComponentFixture<SearchReplaceModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchReplaceModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchReplaceModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
