import { OntologyType, ColumnType } from './enums';

export interface OntologyCustomFilter {
  [ontologyType: string]: {
    [filterKey: string]: string | number | boolean;
  };
}

export interface OntologyTypeConfig {
  value: string;
  label: string;
  customFilters?: OntologyCustomFilter;
}

export interface ColumnTypeConfig {
  value: string;
  label: string;
}

// MS Unique Vocabularies term types based on backend load_ms_term.py
export enum MSTermType {
  INSTRUMENT = 'instrument',
  CLEAVAGE_AGENT = 'cleavage agent',
  DISSOCIATION_METHOD = 'dissociation method',
  SAMPLE_ATTRIBUTE = 'sample attribute',
  CELL_LINE = 'cell line',
  ENRICHMENT_PROCESS = 'enrichment process',
  FRACTIONATION_METHOD = 'fractionation method',
  DATA_ACQUISITION_METHOD = 'proteomics data acquisition method',
  REDUCTION_REAGENT = 'reduction reagent',
  ALKYLATION_REAGENT = 'alkylation reagent',
  MASS_ANALYZER_TYPE = 'mass analyzer type',
  ANCESTRAL_CATEGORY = 'ancestral category',
  SEX = 'sex',
  DEVELOPMENTAL_STAGE = 'developmental stage'
}


// Predefined ontology type configurations matching backend load_column_templates.py
export const ONTOLOGY_TYPE_CONFIGS: OntologyTypeConfig[] = [
  { value: OntologyType.NONE, label: 'None', customFilters: undefined },

  // Basic ontology types without custom filters
  { value: OntologyType.SPECIES, label: 'Species (UniProt)', customFilters: undefined },
  { value: OntologyType.NCBI_TAXONOMY, label: 'NCBI Taxonomy', customFilters: undefined },
  { value: OntologyType.TISSUE, label: 'Tissue (UniProt)', customFilters: undefined },
  { value: OntologyType.HUMAN_DISEASE, label: 'Human Disease (UniProt)', customFilters: undefined },
  { value: OntologyType.MONDO, label: 'MONDO Disease', customFilters: undefined },
  { value: OntologyType.UNIMOD, label: 'Modification (Unimod)', customFilters: undefined },
  { value: OntologyType.UBERON, label: 'Uberon Anatomy', customFilters: undefined },
  { value: OntologyType.SUBCELLULAR_LOCATION, label: 'Subcellular Location (UniProt)', customFilters: undefined },
  { value: OntologyType.CHEBI, label: 'ChEbi', customFilters: undefined },
  { value: OntologyType.CELL_ONTOLOGY, label: 'Cell Ontology', customFilters: undefined },
  { value: OntologyType.PSI_MS, label: 'PSI-MS', customFilters: undefined },

  // MS Unique Vocabularies with specific term_type filters
  {
    value: OntologyType.MS_UNIQUE_VOCABULARIES,
    label: 'Sample Attribute (MS)',
    customFilters: { [OntologyType.MS_UNIQUE_VOCABULARIES]: { term_type: MSTermType.SAMPLE_ATTRIBUTE } }
  },
  {
    value: OntologyType.MS_UNIQUE_VOCABULARIES,
    label: 'Instrument (MS)',
    customFilters: { [OntologyType.MS_UNIQUE_VOCABULARIES]: { term_type: MSTermType.INSTRUMENT } }
  },
  {
    value: OntologyType.MS_UNIQUE_VOCABULARIES,
    label: 'MS Analyzer Type (MS)',
    customFilters: { [OntologyType.MS_UNIQUE_VOCABULARIES]: { term_type: MSTermType.MASS_ANALYZER_TYPE } }
  },
  {
    value: OntologyType.MS_UNIQUE_VOCABULARIES,
    label: 'Cleavage Agent (MS)',
    customFilters: { [OntologyType.MS_UNIQUE_VOCABULARIES]: { term_type: MSTermType.CLEAVAGE_AGENT } }
  },
  {
    value: OntologyType.MS_UNIQUE_VOCABULARIES,
    label: 'Dissociation Method (MS)',
    customFilters: { [OntologyType.MS_UNIQUE_VOCABULARIES]: { term_type: MSTermType.DISSOCIATION_METHOD } }
  },
  {
    value: OntologyType.MS_UNIQUE_VOCABULARIES,
    label: 'Cell Line (MS)',
    customFilters: { [OntologyType.MS_UNIQUE_VOCABULARIES]: { term_type: MSTermType.CELL_LINE } }
  },
  {
    value: OntologyType.MS_UNIQUE_VOCABULARIES,
    label: 'Enrichment Process (MS)',
    customFilters: { [OntologyType.MS_UNIQUE_VOCABULARIES]: { term_type: MSTermType.ENRICHMENT_PROCESS } }
  },
  {
    value: OntologyType.MS_UNIQUE_VOCABULARIES,
    label: 'Fractionation Method (MS)',
    customFilters: { [OntologyType.MS_UNIQUE_VOCABULARIES]: { term_type: MSTermType.FRACTIONATION_METHOD } }
  },
  {
    value: OntologyType.MS_UNIQUE_VOCABULARIES,
    label: 'Data Acquisition Method (MS)',
    customFilters: { [OntologyType.MS_UNIQUE_VOCABULARIES]: { term_type: MSTermType.DATA_ACQUISITION_METHOD } }
  },
  {
    value: OntologyType.MS_UNIQUE_VOCABULARIES,
    label: 'Reduction Reagent (MS)',
    customFilters: { [OntologyType.MS_UNIQUE_VOCABULARIES]: { term_type: MSTermType.REDUCTION_REAGENT } }
  },
  {
    value: OntologyType.MS_UNIQUE_VOCABULARIES,
    label: 'Alkylation Reagent (MS)',
    customFilters: { [OntologyType.MS_UNIQUE_VOCABULARIES]: { term_type: MSTermType.ALKYLATION_REAGENT } }
  },
  {
    value: OntologyType.MS_UNIQUE_VOCABULARIES,
    label: 'Ancestral Category (MS)',
    customFilters: { [OntologyType.MS_UNIQUE_VOCABULARIES]: { term_type: MSTermType.ANCESTRAL_CATEGORY } }
  },
  {
    value: OntologyType.MS_UNIQUE_VOCABULARIES,
    label: 'Sex (MS)',
    customFilters: { [OntologyType.MS_UNIQUE_VOCABULARIES]: { term_type: MSTermType.SEX } }
  },
  {
    value: OntologyType.MS_UNIQUE_VOCABULARIES,
    label: 'Developmental Stage (MS)',
    customFilters: { [OntologyType.MS_UNIQUE_VOCABULARIES]: { term_type: MSTermType.DEVELOPMENTAL_STAGE } }
  }
];

export const COLUMN_TYPE_CONFIGS: ColumnTypeConfig[] = [
  { value: ColumnType.CHARACTERISTICS, label: 'Characteristics' },
  { value: ColumnType.COMMENT, label: 'Comment' },
  { value: ColumnType.FACTOR_VALUE, label: 'Factor Value' },
  { value: ColumnType.SOURCE_NAME, label: 'Source Name' },
  { value: ColumnType.SPECIAL, label: 'Special' }
];