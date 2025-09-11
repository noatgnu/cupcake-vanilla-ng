export interface UnimodSpecification {
  accession: string;
  name: string;
  definition: string;
  additional_data: Array<{id: string; description: string}>;
  general_properties: Record<string, string>;
  specifications: Record<string, UnimodSpecification>;
  delta_mono_mass: string;
  delta_avge_mass: string;
  delta_composition: string;
  [key: string]: any;
}

export interface UnimodFullData {
  accession: string;
  name: string;
  definition: string;
  additional_data: Array<{id: string; description: string}>;
  general_properties: Record<string, string>;
  specifications: Record<string, UnimodSpecification>;
  delta_mono_mass: string;
  delta_avge_mass: string;
  delta_composition: string;
  [key: string]: any;
}

export function isUnimodFullData(suggestion: any): suggestion is { full_data: UnimodFullData } {
  return suggestion && 
    suggestion.ontology_type === 'unimod' && 
    !!suggestion.full_data;
}

export class OntologyUtils {
  static getUnimodSpecifications(suggestion: any): (UnimodSpecification & { specNumber: string })[] {
    if (!isUnimodFullData(suggestion)) return [];
    
    return Object.entries(suggestion.full_data.specifications).map(([specNum, spec]) => ({
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