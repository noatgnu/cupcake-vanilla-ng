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
  displayName?: string;
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
  displayName: string;
  description?: string;
  ontologyType: string;
  fullData?: any;
}