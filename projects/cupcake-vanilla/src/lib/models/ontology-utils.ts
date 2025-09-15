export interface UnimodSpecification {
  accession: string;
  name: string;
  definition: string;
  additionalData: Array<{id: string; description: string}>;
  generalProperties: Record<string, string>;
  specifications: Record<string, UnimodSpecification>;
  deltaMonoMass: string;
  deltaAvgeMass: string;
  deltaComposition: string;
  [key: string]: any;
}

export interface UnimodFullData {
  accession: string;
  name: string;
  definition: string;
  additionalData: Array<{id: string; description: string}>;
  generalProperties: Record<string, string>;
  specifications: Record<string, UnimodSpecification>;
  deltaMonoMass: string;
  deltaAvgeMass: string;
  deltaComposition: string;
  [key: string]: any;
}

import { OntologyType } from './enums';

export function isUnimodFullData(suggestion: any): suggestion is { fullData: UnimodFullData } {
  return suggestion &&
    suggestion.ontologyType === OntologyType.UNIMOD &&
    !!suggestion.fullData;
}

export class OntologyUtils {
  static getUnimodSpecifications(suggestion: any): (UnimodSpecification & { specNumber: string })[] {
    if (!isUnimodFullData(suggestion)) return [];
    
    return Object.entries(suggestion.fullData.specifications).map(([specNum, spec]) => ({
      ...spec,
      specNumber: specNum
    }));
  }

  static getActiveUnimodSpecifications(suggestion: any): (UnimodSpecification & { specNumber: string })[] {
    return this.getUnimodSpecifications(suggestion).filter(spec => !spec['hidden']);
  }

  static formatUnimodName(data: UnimodFullData): string {
    return `${data.name} (${data.accession})`;
  }
}