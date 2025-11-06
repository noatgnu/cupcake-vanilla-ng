import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicAutofill } from './basic-autofill';

describe('BasicAutofill', () => {
  let component: BasicAutofill;
  let fixture: ComponentFixture<BasicAutofill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicAutofill]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicAutofill);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
