export interface Species {
  code: string;
  taxon: string;
  officialName: string;
  commonName?: string;
  synonym?: string;
}

export interface Tissue {
  identifier: string;
  accession: string;
  synonyms?: any;
  crossReferences?: any;
}

export interface HumanDisease {
  identifier: string;
  accession: string;
  synonyms?: any;
  crossReferences?: any;
}

export interface SubcellularLocation {
  identifier: string;
  accession: string;
  synonyms?: any;
  crossReferences?: any;
}

export interface MSUniqueVocabularies {
  identifier: string;
  accession: string;
  synonyms?: any;
  crossReferences?: any;
}

export interface Unimod {
  identifier: string;
  accession: string;
  synonyms?: any;
  crossReferences?: any;
}

export interface MondoDisease {
  identifier: string;
  accession: string;
  synonyms?: any;
  crossReferences?: any;
}

export interface UberonAnatomy {
  identifier: string;
  accession: string;
  synonyms?: any;
  crossReferences?: any;
}

export interface NCBITaxonomy {
  identifier: string;
  accession: string;
  synonyms?: any;
  crossReferences?: any;
}

export interface ChEBICompound {
  identifier: string;
  accession: string;
  synonyms?: any;
  crossReferences?: any;
}

export interface PSIMSOntology {
  identifier: string;
  accession: string;
  synonyms?: any;
  crossReferences?: any;
}

export interface CellOntology {
  identifier: string;
  accession: string;
  synonyms?: any;
  crossReferences?: any;
}

export interface Schema {
  id: number;
  name: string;
  description?: string;
  category?: string;
  version?: string;
  url?: string;
  isActive: boolean;
  columnsCount?: number;
}

export interface OntologySuggestion {
  id: string;
  value: string;
  display_name: string;
  description?: string;
  ontology_type: string;
  full_data?: any;
}

export interface OntologySuggestionResponse {
  count: number;
  next?: string;
  previous?: string;
  results: OntologySuggestion[];
}