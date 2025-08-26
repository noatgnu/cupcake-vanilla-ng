import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsyncTaskMonitor } from './async-task-monitor';

describe('AsyncTaskMonitor', () => {
  let component: AsyncTaskMonitor;
  let fixture: ComponentFixture<AsyncTaskMonitor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsyncTaskMonitor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsyncTaskMonitor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
