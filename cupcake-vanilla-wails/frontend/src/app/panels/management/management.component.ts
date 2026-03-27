import { Component, OnInit, OnDestroy, signal, computed, inject, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WailsService, SyncSchemasOptions, LoadColumnTemplatesOptions, LoadOntologiesOptions } from '../../core/services/wails.service';

interface CommandOption {
  key: string;
  label: string;
  type: 'boolean' | 'number' | 'select';
  value: boolean | number | string[];
  description: string;
  choices?: { value: string; label: string }[];
}

interface CommandStatus {
  name: string;
  displayName: string;
  description: string;
  running: boolean;
  success: boolean | null;
  count: number | null;
  icon: string;
  expanded: boolean;
  options: CommandOption[];
}

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  ontologyTypes = [
    { value: 'psims', label: 'PSIMS' },
    { value: 'cell', label: 'Cell Ontology' },
    { value: 'mondo', label: 'MONDO Disease' },
    { value: 'uberon', label: 'UBERON Anatomy' }
  ];

  commands = signal<CommandStatus[]>([
    {
      name: 'sync-schemas',
      displayName: 'SDRF Schema Synchronization',
      description: 'Fetch official metadata schemas from centralized repositories',
      running: false,
      success: null,
      count: null,
      icon: 'bi bi-arrow-repeat',
      expanded: false,
      options: [
        { key: 'force', label: 'Force Re-download', type: 'boolean', value: false, description: 'Force re-download of schema files (schemas update by default)' }
      ]
    },
    {
      name: 'load-column-templates',
      displayName: 'Column Template Provisioning',
      description: 'Import standardized column definitions into local storage',
      running: false,
      success: null,
      count: null,
      icon: 'bi bi-file-earmark-text',
      expanded: false,
      options: [
        { key: 'clear', label: 'Clear Existing', type: 'boolean', value: true, description: 'Remove existing templates before importing (prevents duplicates)' }
      ]
    },
    {
      name: 'load-ontologies',
      displayName: 'Ontology Initialization',
      description: 'Import biological and chemical ontology terminologies',
      running: false,
      success: null,
      count: null,
      icon: 'bi bi-diagram-3',
      expanded: false,
      options: [
        { key: 'noLimit', label: 'Load All Terms', type: 'boolean', value: true, description: 'Load all ontology terms without limit' },
        { key: 'limit', label: 'Term Limit', type: 'number', value: 1000, description: 'Maximum number of terms to load (when not loading all)' },
        { key: 'types', label: 'Ontology Types', type: 'select', value: [], description: 'Specific ontology types to load (empty = all)' }
      ]
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

  toggleExpanded(name: string): void {
    this.commands.update(cmds =>
      cmds.map(cmd => cmd.name === name ? { ...cmd, expanded: !cmd.expanded } : cmd)
    );
  }

  getOptionValue(cmdName: string, optionKey: string): boolean | number | string[] {
    const cmd = this.commands().find(c => c.name === cmdName);
    const option = cmd?.options.find(o => o.key === optionKey);
    return option?.value ?? false;
  }

  setOptionValue(cmdName: string, optionKey: string, value: boolean | number | string[]): void {
    this.commands.update(cmds =>
      cmds.map(cmd => {
        if (cmd.name !== cmdName) return cmd;
        return {
          ...cmd,
          options: cmd.options.map(opt =>
            opt.key === optionKey ? { ...opt, value } : opt
          )
        };
      })
    );
  }

  toggleOntologyType(type: string): void {
    const currentTypes = this.getOptionValue('load-ontologies', 'types') as string[];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    this.setOptionValue('load-ontologies', 'types', newTypes);
  }

  isOntologyTypeSelected(type: string): boolean {
    const types = this.getOptionValue('load-ontologies', 'types') as string[];
    return types.includes(type);
  }

  async runCommand(name: string): Promise<void> {
    this.setCommandStatus(name, true);
    this.addOutput(`Initiating ${name} process...`, 'info');

    const cmd = this.commands().find(c => c.name === name);
    const options = cmd?.options.reduce((acc, opt) => ({ ...acc, [opt.key]: opt.value }), {}) ?? {};

    try {
      switch (name) {
        case 'sync-schemas':
          await this.wails.runSyncSchemas(options as SyncSchemasOptions);
          break;
        case 'load-column-templates':
          await this.wails.runLoadColumnTemplates(options as LoadColumnTemplatesOptions);
          break;
        case 'load-ontologies':
          await this.wails.runLoadOntologies(options as LoadOntologiesOptions);
          break;
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
