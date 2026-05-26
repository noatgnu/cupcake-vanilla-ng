import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PluginIframe } from './plugin-iframe';
import { PluginWidgetDefinition } from '../../models/plugin';

describe('PluginIframe', () => {
  let component: PluginIframe;
  let fixture: ComponentFixture<PluginIframe>;

  const definition: PluginWidgetDefinition = { id: 'w1', type: 'iframe', src: '/embed' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PluginIframe],
    }).compileComponents();

    fixture = TestBed.createComponent(PluginIframe);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('definition', definition);
    fixture.componentRef.setInput('baseUrl', 'http://plugin.local');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should produce safe URL from relative src', () => {
    const url = component.safeUrl;
    expect(url).toBeTruthy();
  });

  it('should use absolute src directly when it starts with http', () => {
    fixture.componentRef.setInput('definition', { id: 'w2', type: 'iframe', src: 'https://external.com/embed' });
    const url = String(component.safeUrl);
    expect(url).toContain('external.com');
  });

  it('should prefix relative src with baseUrl', () => {
    fixture.componentRef.setInput('definition', { id: 'w3', type: 'iframe', src: '/dashboard' });
    fixture.componentRef.setInput('baseUrl', 'http://plugin.local');
    const url = String(component.safeUrl);
    expect(url).toContain('plugin.local');
  });
});
