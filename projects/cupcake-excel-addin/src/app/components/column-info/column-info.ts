import { Component, input, computed, inject } from '@angular/core';
import { MetadataColumn, SdrfSyntaxService, SyntaxType, OntologyTypeLabels, OntologyType } from '@noatgnu/cupcake-vanilla';

@Component({
  selector: 'app-column-info',
  imports: [],
  templateUrl: './column-info.html',
  styleUrl: './column-info.scss',
})
export class ColumnInfo {
  private sdrfSyntax = inject(SdrfSyntaxService);

  readonly column = input<MetadataColumn | null>(null);
  readonly cellValue = input<string>('');

  readonly syntaxType = computed<SyntaxType | null>(() => {
    const col = this.column();
    if (!col) return null;
    return this.sdrfSyntax.detectSpecialSyntax(col.name, col.type || '');
  });

  readonly parsedValue = computed<Record<string, string> | null>(() => {
    const type = this.syntaxType();
    const value = this.cellValue();
    if (!type || !value) return null;
    try {
      const parsed = this.sdrfSyntax.parseValue(type, value);
      if (!parsed) return null;
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>)
          .filter(([, v]) => v !== null && v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)])
      );
    } catch {
      return null;
    }
  });

  readonly ontologyLabel = computed(() => {
    const col = this.column();
    if (!col?.ontologyType) return null;
    return OntologyTypeLabels[col.ontologyType as OntologyType] || col.ontologyType;
  });

  readonly syntaxLabel = computed(() => {
    switch (this.syntaxType()) {
      case 'age': return 'Age Format';
      case 'modification': return 'Modification Parameters';
      case 'cleavage': return 'Cleavage Agent Details';
      default: return null;
    }
  });

  readonly columnTypeLabel = computed(() => {
    const col = this.column();
    if (!col) return '';
    switch (col.type) {
      case 'characteristics': return 'Characteristics';
      case 'comment': return 'Comment';
      case 'factor value': return 'Factor Value';
      case 'material type': return 'Material Type';
      default: return col.type || '';
    }
  });

  objectEntries(obj: Record<string, string>): [string, string][] {
    return Object.entries(obj);
  }
}
