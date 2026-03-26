import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagementComponent } from './management.component';
import { WailsService, CommandOutput } from '../../core/services/wails.service';
import { signal, WritableSignal } from '@angular/core';

describe('ManagementComponent', () => {
  let component: ManagementComponent;
  let fixture: ComponentFixture<ManagementComponent>;
  let mockWailsService: jasmine.SpyObj<WailsService>;
  let commandOutputSignal: WritableSignal<CommandOutput | null>;

  const mockOntologyCounts = {
    psims: 100,
    cell: 200,
    mondo: 300,
    uberon: 400,
    total: 1000
  };

  beforeEach(async () => {
    commandOutputSignal = signal<CommandOutput | null>(null);

    mockWailsService = jasmine.createSpyObj('WailsService', [
      'getSchemaCount',
      'getColumnTemplateCount',
      'getOntologyCounts',
      'runSyncSchemas',
      'runLoadColumnTemplates',
      'runLoadOntologies',
      'logToFile'
    ], {
      commandOutput: commandOutputSignal.asReadonly(),
      isWails: false
    });

    mockWailsService.getSchemaCount.and.resolveTo(10);
    mockWailsService.getColumnTemplateCount.and.resolveTo(50);
    mockWailsService.getOntologyCounts.and.resolveTo(mockOntologyCounts);
    mockWailsService.runSyncSchemas.and.resolveTo();
    mockWailsService.runLoadColumnTemplates.and.resolveTo();
    mockWailsService.runLoadOntologies.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [ManagementComponent],
      providers: [
        { provide: WailsService, useValue: mockWailsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have three commands', () => {
    expect(component.commands().length).toBe(3);
  });

  it('should have sync-schemas command', () => {
    const cmd = component.commands().find(c => c.name === 'sync-schemas');
    expect(cmd).toBeTruthy();
    expect(cmd?.displayName).toBe('SDRF Schema Synchronization');
  });

  it('should have load-column-templates command', () => {
    const cmd = component.commands().find(c => c.name === 'load-column-templates');
    expect(cmd).toBeTruthy();
  });

  it('should have load-ontologies command', () => {
    const cmd = component.commands().find(c => c.name === 'load-ontologies');
    expect(cmd).toBeTruthy();
  });

  it('should start with empty output lines', () => {
    expect(component.outputLines().length).toBe(0);
  });

  describe('ngOnInit', () => {
    it('should refresh stats on init', async () => {
      await component.ngOnInit();
      expect(mockWailsService.getSchemaCount).toHaveBeenCalled();
      expect(mockWailsService.getColumnTemplateCount).toHaveBeenCalled();
      expect(mockWailsService.getOntologyCounts).toHaveBeenCalled();
    });

    it('should set schema count', async () => {
      await component.ngOnInit();
      expect(component.schemaCount()).toBe(10);
    });

    it('should set column template count', async () => {
      await component.ngOnInit();
      expect(component.columnTemplateCount()).toBe(50);
    });

    it('should set ontology counts', async () => {
      await component.ngOnInit();
      expect(component.ontologyCounts()).toEqual(mockOntologyCounts);
    });
  });

  describe('ontologyTotal', () => {
    it('should return total from ontology counts', async () => {
      await component.ngOnInit();
      expect(component.ontologyTotal()).toBe(1000);
    });

    it('should return 0 when no counts', () => {
      expect(component.ontologyTotal()).toBe(0);
    });
  });

  describe('ontologyBreakdown', () => {
    it('should return breakdown with counts > 0', async () => {
      await component.ngOnInit();
      const breakdown = component.ontologyBreakdown();
      expect(breakdown.length).toBeGreaterThan(0);
      expect(breakdown.every(item => item.count > 0)).toBeTrue();
    });

    it('should uppercase names', async () => {
      await component.ngOnInit();
      const breakdown = component.ontologyBreakdown();
      expect(breakdown.every(item => item.name === item.name.toUpperCase())).toBeTrue();
    });
  });

  describe('refreshStats', () => {
    it('should update command counts', async () => {
      await component.refreshStats();
      const syncCmd = component.commands().find(c => c.name === 'sync-schemas');
      expect(syncCmd?.count).toBe(10);
    });
  });

  describe('runCommand', () => {
    beforeEach(async () => {
      fixture.detectChanges();
    });

    it('should run sync-schemas command', async () => {
      await component.runCommand('sync-schemas');
      expect(mockWailsService.runSyncSchemas).toHaveBeenCalled();
    });

    it('should run load-column-templates command', async () => {
      await component.runCommand('load-column-templates');
      expect(mockWailsService.runLoadColumnTemplates).toHaveBeenCalled();
    });

    it('should run load-ontologies command', async () => {
      await component.runCommand('load-ontologies');
      expect(mockWailsService.runLoadOntologies).toHaveBeenCalled();
    });

    it('should set command to running', async () => {
      const promise = component.runCommand('sync-schemas');
      const cmd = component.commands().find(c => c.name === 'sync-schemas');
      expect(cmd?.running).toBeTrue();
      await promise;
    });

    it('should set command to not running after completion', async () => {
      await component.runCommand('sync-schemas');
      const cmd = component.commands().find(c => c.name === 'sync-schemas');
      expect(cmd?.running).toBeFalse();
    });

    it('should add output line on start', async () => {
      await component.runCommand('sync-schemas');
      const lines = component.outputLines();
      expect(lines.some(l => l.text.includes('sync-schemas'))).toBeTrue();
    });

    it('should add success output on completion', async () => {
      await component.runCommand('sync-schemas');
      const lines = component.outputLines();
      expect(lines.some(l => l.type === 'success')).toBeTrue();
    });

    it('should handle command error', async () => {
      mockWailsService.runSyncSchemas.and.rejectWith(new Error('Command failed'));
      await component.runCommand('sync-schemas');
      const lines = component.outputLines();
      expect(lines.some(l => l.type === 'error')).toBeTrue();
    });

    it('should refresh stats after command completion', async () => {
      await component.runCommand('sync-schemas');
      expect(mockWailsService.getSchemaCount).toHaveBeenCalled();
    });
  });

  describe('command output signal', () => {
    it('should add output from service', () => {
      fixture.detectChanges();
      commandOutputSignal.set({ command: 'test', output: 'Test output', type: 'info' });
      fixture.detectChanges();

      const lines = component.outputLines();
      expect(lines.some(l => l.text === 'Test output')).toBeTrue();
    });

    it('should handle error type output', () => {
      fixture.detectChanges();
      commandOutputSignal.set({ command: 'test', output: 'Error message', type: 'error' });
      fixture.detectChanges();

      const lines = component.outputLines();
      const errorLine = lines.find(l => l.text === 'Error message');
      expect(errorLine?.type).toBe('error');
    });
  });
});
