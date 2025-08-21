/**
 * MetadataColumn - Used when columns are actually instantiated in a metadata table.
 * This includes table-specific properties like mandatory and hidden flags.
 */
export interface MetadataColumn {
  id?: number;
  name: string;
  type: string;
  value?: string;
  column_position?: number;
  mandatory?: boolean;        // Applied when used in a table
  hidden?: boolean;           // Applied when used in a table
  readonly?: boolean;         // Whether this column is read-only
  not_applicable?: boolean;
  auto_generated?: boolean;
  modifiers?: Array<{
    samples: string; // e.g., "1,2,3" or "1-3,5"
    value: string;
  }>;
  ontology_type?: string;
  enable_typeahead?: boolean;
  template_id?: number;       // Reference to the template this was created from
  created_at?: string;
  updated_at?: string;
}

/**
 * MetadataColumnTemplate - Template definition for creating metadata columns.
 * This is the blueprint that can be used to create actual MetadataColumns in tables.
 * The mandatory and hidden properties are applied when the template is used in a table.
 */
export interface MetadataColumnTemplate {
  id?: number;
  name: string;                    // Template name
  description?: string;            // Description of what this column template is for
  column_name: string;             // Default name for the metadata column
  column_type: string;             // Data type (e.g., 'factor value', 'characteristics')
  default_value?: string;          // Default value for the column
  default_position?: number;       // Default position for the column
  ontology_type?: string;          // Type of ontology to use
  ontology_options?: string[];     // Available ontology options
  custom_ontology_filters?: any;   // Custom filters for ontology queries
  enable_typeahead?: boolean;      // Enable typeahead suggestions
  excel_validation?: boolean;      // Add dropdown validation in Excel exports
  custom_validation_rules?: any;   // Custom validation rules
  api_enhancements?: any;          // Additional API enhancements
  visibility: string;              // Visibility level ('private', 'lab_group', 'public', 'global')
  creator?: number;                // User who created this template
  lab_group?: number;              // Lab group this template belongs to
  is_system_template?: boolean;    // Whether this is a system-provided template
  is_active?: boolean;             // Whether this template is active
  usage_count?: number;            // Number of times used
  tags?: string[];                 // Tags for categorizing
  category?: string;               // Category for organizing
  source_schema?: string;          // Schema this template was loaded from
  created_at?: string;
  updated_at?: string;
  last_used_at?: string;
  base_column?: boolean;           // Whether this is a base column template
}

export interface FavouriteMetadataOption {
  id?: number;
  name: string;
  type: string;
  column_template?: number;
  value: string;
  display_value?: string;
  user?: number;
  user_username?: string;
  lab_group?: number;
  lab_group_name?: string;
  is_global?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Ontology-specific full_data interfaces
export interface SpeciesFullData {
  code: string;
  taxon: number;
  official_name: string;
  common_name: string;
  synonym: string;
}

export interface TissueFullData {
  identifier: string;
  accession: string;
  synonyms: string;
  cross_references: string;
}

export interface HumanDiseaseFullData {
  identifier: string;
  acronym: string;
  accession: string;
  definition: string;
  synonyms: string;
  cross_references: string;
  keywords: string;
}

export interface SubcellularLocationFullData {
  location_identifier: string;
  topology_identifier: string;
  orientation_identifier: string;
  accession: string;
  definition: string;
  synonyms: string;
}

export interface UnimodSpecification {
  group: string;
  hidden: string;
  site: string;
  position: string;
  classification: string;
  neutral_loss_98_mono_mass?: string;
  neutral_loss_98_avge_mass?: string;
  neutral_loss_98_flag?: string;
  neutral_loss_98_composition?: string;
  neutral_loss_0_mono_mass?: string;
  neutral_loss_0_avge_mass?: string;
  neutral_loss_0_flag?: string;
  neutral_loss_0_composition?: string;
  misc_notes?: string;
}

export interface UnimodFullData {
  accession: string;
  name: string;
  definition: string;
  additional_data: Array<{id: string; description: string}>;
  general_properties: Record<string, string>;
  specifications: Record<string, UnimodSpecification>;
  // Direct access properties
  delta_mono_mass: string;
  delta_avge_mass: string;
  delta_composition: string;
  record_id: string;
  date_posted: string;
  date_modified: string;
  approved: string;
}

export interface MSVocabulariesFullData {
  accession: string;
  name: string;
  definition: string;
  term_type: string;
}

export interface NCBITaxonomyFullData {
  tax_id: number;
  scientific_name: string;
  common_name: string;
  synonyms: string;
  rank: string;
  division: string;
}

export interface ChEBIFullData {
  identifier: string;
  name: string;
  definition: string;
  synonyms: string;
  formula: string;
  mass: number;
  charge: number;
  inchi: string;
  smiles: string;
  parent_terms: string;
  roles: string;
}

export interface MondoFullData {
  identifier: string;
  name: string;
  definition: string;
  synonyms: string;
  xrefs: string;
  parent_terms: string;
  obsolete: boolean;
  replacement_term: string;
}

export interface UberonFullData {
  identifier: string;
  name: string;
  definition: string;
  synonyms: string;
  xrefs: string;
  parent_terms: string;
  part_of: string;
  develops_from: string;
  obsolete: boolean;
  replacement_term: string;
}

export interface CellOntologyFullData {
  identifier: string;
  name: string;
  definition: string;
  synonyms: string;
  organism: string;
  category: string;
  xrefs: string;
  parent_terms: string;
  obsolete: boolean;
}

export interface PSIMSOntologyFullData {
  identifier: string;
  name: string;
  definition: string;
  synonyms: string;
  xrefs: string;
  parent_terms: string;
  is_obsolete: boolean;
}

// Union type for all possible full_data structures
export type OntologyFullData = 
  | SpeciesFullData
  | TissueFullData
  | HumanDiseaseFullData
  | SubcellularLocationFullData
  | UnimodFullData
  | MSVocabulariesFullData
  | NCBITaxonomyFullData
  | ChEBIFullData
  | MondoFullData
  | UberonFullData
  | CellOntologyFullData
  | PSIMSOntologyFullData
  | Record<string, any>; // Fallback for unknown types

export interface OntologySuggestion {
  id: string;
  value: string;
  display_name: string;
  description?: string;
  ontology_type: string;
  full_data?: OntologyFullData;
}

export interface OntologySuggestionResponse {
  suggestions: OntologySuggestion[];
  has_more: boolean;
  total_count: number;
}

// Type guards for ontology full_data
export const isSpeciesFullData = (suggestion: OntologySuggestion): suggestion is OntologySuggestion & { full_data: SpeciesFullData } => {
  return suggestion.ontology_type === 'species' && !!suggestion.full_data;
};

export const isTissueFullData = (suggestion: OntologySuggestion): suggestion is OntologySuggestion & { full_data: TissueFullData } => {
  return suggestion.ontology_type === 'tissue' && !!suggestion.full_data;
};

export const isHumanDiseaseFullData = (suggestion: OntologySuggestion): suggestion is OntologySuggestion & { full_data: HumanDiseaseFullData } => {
  return suggestion.ontology_type === 'human_disease' && !!suggestion.full_data;
};

export const isUnimodFullData = (suggestion: OntologySuggestion): suggestion is OntologySuggestion & { full_data: UnimodFullData } => {
  return suggestion.ontology_type === 'unimod' && !!suggestion.full_data;
};

export const isChEBIFullData = (suggestion: OntologySuggestion): suggestion is OntologySuggestion & { full_data: ChEBIFullData } => {
  return suggestion.ontology_type === 'chebi' && !!suggestion.full_data;
};

export const isNCBITaxonomyFullData = (suggestion: OntologySuggestion): suggestion is OntologySuggestion & { full_data: NCBITaxonomyFullData } => {
  return suggestion.ontology_type === 'ncbi_taxonomy' && !!suggestion.full_data;
};

export const isMondoFullData = (suggestion: OntologySuggestion): suggestion is OntologySuggestion & { full_data: MondoFullData } => {
  return suggestion.ontology_type === 'mondo' && !!suggestion.full_data;
};

export const isUberonFullData = (suggestion: OntologySuggestion): suggestion is OntologySuggestion & { full_data: UberonFullData } => {
  return suggestion.ontology_type === 'uberon' && !!suggestion.full_data;
};

export const isCellOntologyFullData = (suggestion: OntologySuggestion): suggestion is OntologySuggestion & { full_data: CellOntologyFullData } => {
  return suggestion.ontology_type === 'cell_ontology' && !!suggestion.full_data;
};

export const isPSIMSOntologyFullData = (suggestion: OntologySuggestion): suggestion is OntologySuggestion & { full_data: PSIMSOntologyFullData } => {
  return suggestion.ontology_type === 'psi_ms' && !!suggestion.full_data;
};

// Utility functions for working with ontology data
export class OntologyUtils {
  
  /**
   * Get typed full_data for a suggestion based on its ontology type
   */
  static getTypedFullData<T extends OntologyFullData>(suggestion: OntologySuggestion): T | null {
    return suggestion.full_data as T || null;
  }

  /**
   * Get Unimod specifications as a typed array
   */
  static getUnimodSpecifications(suggestion: OntologySuggestion): (UnimodSpecification & { specNumber: string })[] {
    if (!isUnimodFullData(suggestion)) return [];
    
    return Object.entries(suggestion.full_data.specifications).map(([specNum, spec]) => ({
      ...spec,
      specNumber: specNum
    }));
  }

  /**
   * Get active (non-hidden) Unimod specifications
   */
  static getActiveUnimodSpecifications(suggestion: OntologySuggestion): (UnimodSpecification & { specNumber: string })[] {
    return this.getUnimodSpecifications(suggestion).filter(spec => spec.hidden !== '1');
  }

  /**
   * Get chemical formula from ChEBI suggestion
   */
  static getChemicalFormula(suggestion: OntologySuggestion): string | null {
    if (!isChEBIFullData(suggestion)) return null;
    return suggestion.full_data.formula || null;
  }

  /**
   * Get molecular mass from ChEBI suggestion
   */
  static getMolecularMass(suggestion: OntologySuggestion): number | null {
    if (!isChEBIFullData(suggestion)) return null;
    return suggestion.full_data.mass || null;
  }

  /**
   * Get taxonomy ID from species or NCBI taxonomy suggestion
   */
  static getTaxonomyId(suggestion: OntologySuggestion): number | null {
    if (isSpeciesFullData(suggestion)) {
      return suggestion.full_data.taxon;
    }
    if (isNCBITaxonomyFullData(suggestion)) {
      return suggestion.full_data.tax_id;
    }
    return null;
  }

  /**
   * Check if an ontology term is obsolete
   */
  static isObsolete(suggestion: OntologySuggestion): boolean {
    if (isMondoFullData(suggestion) || isUberonFullData(suggestion) || isCellOntologyFullData(suggestion)) {
      return suggestion.full_data.obsolete || false;
    }
    if (isPSIMSOntologyFullData(suggestion)) {
      return suggestion.full_data.is_obsolete || false;
    }
    return false;
  }

  /**
   * Get cross-references/external links
   */
  static getCrossReferences(suggestion: OntologySuggestion): string[] {
    let xrefs = '';
    
    if (isTissueFullData(suggestion) || isHumanDiseaseFullData(suggestion)) {
      xrefs = suggestion.full_data.cross_references || '';
    } else if (isMondoFullData(suggestion) || isUberonFullData(suggestion) || 
               isCellOntologyFullData(suggestion) || isPSIMSOntologyFullData(suggestion)) {
      xrefs = suggestion.full_data.xrefs || '';
    }
    
    return xrefs ? xrefs.split(';').map(ref => ref.trim()).filter(ref => ref.length > 0) : [];
  }

  /**
   * Get synonyms as an array
   */
  static getSynonyms(suggestion: OntologySuggestion): string[] {
    let synonyms = '';
    
    if (suggestion.full_data && 'synonyms' in suggestion.full_data) {
      synonyms = suggestion.full_data.synonyms as string || '';
    }
    
    return synonyms ? synonyms.split(';').map(syn => syn.trim()).filter(syn => syn.length > 0) : [];
  }
}
