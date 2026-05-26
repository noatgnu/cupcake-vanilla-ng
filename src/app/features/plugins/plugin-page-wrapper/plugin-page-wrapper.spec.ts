import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PluginPageWrapper } from './plugin-page-wrapper';

describe('PluginPageWrapper', () => {
  let component: PluginPageWrapper;
  let fixture: ComponentFixture<PluginPageWrapper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginPageWrapper]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PluginPageWrapper);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
