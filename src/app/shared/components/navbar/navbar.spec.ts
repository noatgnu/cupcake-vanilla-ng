import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AuthService, CUPCAKE_CORE_CONFIG, Plugin, PluginService, User } from '@noatgnu/cupcake-core';
import { Websocket } from '@noatgnu/cupcake-vanilla';
import { NavbarComponent } from './navbar';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authenticated: WritableSignal<boolean>;
  let pluginService: jasmine.SpyObj<PluginService>;
  const mockConfig = {
    apiUrl: 'https://api.test.com',
    siteName: 'Test Site'
  };

  async function create(loggedIn: boolean): Promise<void> {
    authenticated = signal(loggedIn);
    pluginService = jasmine.createSpyObj('PluginService', ['listPlugins']);
    pluginService.listPlugins.and.returnValue(of([{ isActive: true } as Plugin, { isActive: false } as Plugin]));
    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig },
        { provide: PluginService, useValue: pluginService },
        {
          provide: AuthService,
          useValue: {
            authenticated,
            isAuthenticated: () => authenticated(),
            getAccessToken: () => null,
            currentUser: signal<User | null>(null),
            logout: jasmine.createSpy('logout').and.returnValue(of(null))
          }
        }
      ]
    }).compileComponents();
    spyOn(TestBed.inject(Websocket), 'connect');

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await create(false);
    expect(component).toBeTruthy();
  });

  it('should not request plugins for a guest', async () => {
    await create(false);
    expect(pluginService.listPlugins).not.toHaveBeenCalled();
  });

  it('should load the active plugins once the user is logged in', async () => {
    await create(false);
    authenticated.set(true);
    fixture.detectChanges();
    expect(pluginService.listPlugins).toHaveBeenCalledTimes(1);
    expect(component.activePlugins().length).toBe(1);
  });
});
