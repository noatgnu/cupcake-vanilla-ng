import { Component, OnInit, OnDestroy, signal, computed, inject, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WailsService } from '../../core/services/wails.service';

interface CommandStatus {
  name: string;
  displayName: string;
  description: string;
  running: boolean;
  success: boolean | null;
  count: number | null;
  icon: string;
}

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './management.component.html',
  styleUrl: './management.component.scss'
})
export class ManagementComponent implements OnInit, OnDestroy {
  @ViewChild('terminalViewport') private terminalViewport!: ElementRef;
  private wails = inject(WailsService);
  private lastOutputTime = 0;

  constructor() {
    effect(() => {
      const output = this.wails.commandOutput();
      if (output && Date.now() - this.lastOutputTime > 100) {
        this.lastOutputTime = Date.now();
        const type = output.type === 'error' ? 'error' : 'info';
        this.addOutput(output.output, type);
      }
    });
  }

  commands = signal<CommandStatus[]>([
    {
      name: 'sync-schemas',
      displayName: 'SDRF Schema Synchronization',
      description: 'Fetch official metadata schemas from centralized repositories',
      running: false,
      success: null,
      count: null,
      icon: 'bi bi-arrow-repeat'
    },
    {
      name: 'load-column-templates',
      displayName: 'Column Template Provisioning',
      description: 'Import standardized column definitions into local storage',
      running: false,
      success: null,
      count: null,
      icon: 'bi bi-file-earmark-text'
    },
    {
      name: 'load-ontologies',
      displayName: 'Ontology Initialization',
      description: 'Import biological and chemical ontology terminologies',
      running: false,
      success: null,
      count: null,
      icon: 'bi bi-diagram-3'
    }
  ]);

  schemaCount = signal(0);
  columnTemplateCount = signal(0);
  ontologyCounts = signal<Record<string, number>>({});

  ontologyTotal = computed(() => this.ontologyCounts()['total'] || 0);

  ontologyBreakdown = computed(() => {
    const counts = this.ontologyCounts();
    return ['mondo', 'uberon', 'ncbi', 'chebi', 'psims', 'cell']
      .map(name => ({
        name: name.toUpperCase(),
        count: counts[name] || 0
      }))
      .filter(item => item.count > 0);
  });

  outputLines = signal<{text: string; type: string}[]>([]);

  async ngOnInit(): Promise<void> {
    await this.refreshStats();
  }

  ngOnDestroy(): void {}

  async refreshStats(): Promise<void> {
    try {
      const [schemas, templates, ontologies] = await Promise.all([
        this.wails.getSchemaCount(),
        this.wails.getColumnTemplateCount(),
        this.wails.getOntologyCounts()
      ]);

      this.schemaCount.set(schemas);
      this.columnTemplateCount.set(templates);
      this.ontologyCounts.set(ontologies);

      this.updateCommandCount('sync-schemas', schemas);
      this.updateCommandCount('load-column-templates', templates);
      this.updateCommandCount('load-ontologies', ontologies['total'] || 0);
    } catch (error) {
      this.wails.logToFile(`Stat refresh failure: ${error}`);
    }
  }

  private updateCommandCount(name: string, count: number): void {
    this.commands.update(cmds =>
      cmds.map(cmd => cmd.name === name ? { ...cmd, count } : cmd)
    );
  }

  async runCommand(name: string): Promise<void> {
    this.setCommandStatus(name, true);
    this.addOutput(`Initiating ${name} process...`, 'info');

    try {
      switch (name) {
        case 'sync-schemas': await this.wails.runSyncSchemas(); break;
        case 'load-column-templates': await this.wails.runLoadColumnTemplates(); break;
        case 'load-ontologies': await this.wails.runLoadOntologies(); break;
      }

      this.setCommandStatus(name, false, true);
      this.addOutput('Process completed successfully.', 'success');
      await this.refreshStats();
    } catch (error) {
      this.setCommandStatus(name, false, false);
      this.addOutput(`Process failed: ${error}`, 'error');
    }
  }

  private setCommandStatus(name: string, running: boolean, success: boolean | null = null): void {
    this.commands.update(cmds =>
      cmds.map(cmd => cmd.name === name ? { ...cmd, running, success: success ?? cmd.success } : cmd)
    );
  }

  private addOutput(text: string, type: string): void {
    this.outputLines.update(lines => [...lines, { text, type }]);
    setTimeout(() => this.scrollToBottom(), 10);
  }

  private scrollToBottom(): void {
    if (this.terminalViewport) {
      const el = this.terminalViewport.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
