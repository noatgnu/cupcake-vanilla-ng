import { ColumnType } from './enums';

export interface SdrfColumnConfig {
  name: string;
  type: string;
  description: string;
  category?: SdrfColumnCategory;
  isRequired?: boolean;
}

export enum SdrfColumnCategory {
  CORE_SAMPLE = 'Core Sample Metadata',
  CHARACTERISTICS = 'Characteristics',
  ASSAY = 'Assay Information',
  COMMENTS = 'Comments',
  MODIFICATIONS = 'Modifications & Enzymes',
  MASS_TOLERANCES = 'Mass Tolerances',
  TECHNICAL_PARAMS = 'Technical Parameters',
  SAMPLE_PREP = 'Sample Preparation',
  FILE_PROJECT = 'File & Project Information'
}

// Official SDRF-Proteomics column configurations based on specification
export const OFFICIAL_SDRF_COLUMNS: SdrfColumnConfig[] = [
  // Core sample metadata
  {
    name: 'source name',
    type: ColumnType.SOURCE_NAME,
    description: 'Unique sample identifier',
    category: SdrfColumnCategory.CORE_SAMPLE,
    isRequired: true
  },

  // Required characteristics
  {
    name: 'characteristics[organism]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Organism of the sample',
    category: SdrfColumnCategory.CHARACTERISTICS,
    isRequired: true
  },
  {
    name: 'characteristics[disease]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Disease under study',
    category: SdrfColumnCategory.CHARACTERISTICS,
    isRequired: true
  },
  {
    name: 'characteristics[organism part]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Part of organism anatomy',
    category: SdrfColumnCategory.CHARACTERISTICS,
    isRequired: true
  },
  {
    name: 'characteristics[cell type]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Cell type',
    category: SdrfColumnCategory.CHARACTERISTICS
  },

  // Additional characteristics
  {
    name: 'characteristics[age]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Age of the individual',
    category: SdrfColumnCategory.CHARACTERISTICS
  },
  {
    name: 'characteristics[enrichment process]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Enrichment process applied',
    category: SdrfColumnCategory.CHARACTERISTICS
  },
  {
    name: 'characteristics[pooled sample]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Pooled sample indicator',
    category: SdrfColumnCategory.CHARACTERISTICS
  },
  {
    name: 'characteristics[spiked compound]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Spiked compound details',
    category: SdrfColumnCategory.CHARACTERISTICS
  },
  {
    name: 'characteristics[synthetic peptide]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Synthetic peptide indicator',
    category: SdrfColumnCategory.CHARACTERISTICS
  },
  {
    name: 'characteristics[xenograft]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Xenograft description',
    category: SdrfColumnCategory.CHARACTERISTICS
  },
  {
    name: 'characteristics[source name]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Reference to source sample',
    category: SdrfColumnCategory.CHARACTERISTICS
  },
  {
    name: 'characteristics[individual]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Patient identifier',
    category: SdrfColumnCategory.CHARACTERISTICS
  },
  {
    name: 'characteristics[mass]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Sample mass',
    category: SdrfColumnCategory.CHARACTERISTICS
  },
  {
    name: 'characteristics[biological replicate]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Biological replicate number',
    category: SdrfColumnCategory.CHARACTERISTICS
  },
  {
    name: 'characteristics[phenotype]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Sample phenotype',
    category: SdrfColumnCategory.CHARACTERISTICS
  },
  {
    name: 'characteristics[compound]',
    type: ColumnType.CHARACTERISTICS,
    description: 'Compound applied',
    category: SdrfColumnCategory.CHARACTERISTICS
  },

  // Assay information
  {
    name: 'assay name',
    type: ColumnType.SPECIAL,
    description: 'MS run identifier',
    category: SdrfColumnCategory.ASSAY,
    isRequired: true
  },
  {
    name: 'technology type',
    type: ColumnType.SPECIAL,
    description: 'Technology used for data generation',
    category: SdrfColumnCategory.ASSAY,
    isRequired: true
  },

  // Required comment fields
  {
    name: 'comment[fraction identifier]',
    type: ColumnType.COMMENT,
    description: 'Fraction number',
    category: SdrfColumnCategory.COMMENTS
  },
  {
    name: 'comment[label]',
    type: ColumnType.COMMENT,
    description: 'Label applied to sample',
    category: SdrfColumnCategory.COMMENTS,
    isRequired: true
  },
  {
    name: 'comment[data file]',
    type: ColumnType.COMMENT,
    description: 'Raw data file name',
    category: SdrfColumnCategory.COMMENTS,
    isRequired: true
  },
  {
    name: 'comment[instrument]',
    type: ColumnType.COMMENT,
    description: 'Mass spectrometer model',
    category: SdrfColumnCategory.COMMENTS,
    isRequired: true
  },
  {
    name: 'comment[technical replicate]',
    type: ColumnType.COMMENT,
    description: 'Technical replicate number',
    category: SdrfColumnCategory.COMMENTS
  },

  // Modification and enzyme information
  {
    name: 'comment[modification parameters]',
    type: ColumnType.COMMENT,
    description: 'Protein modifications',
    category: SdrfColumnCategory.MODIFICATIONS,
    isRequired: true
  },
  {
    name: 'comment[cleavage agent details]',
    type: ColumnType.COMMENT,
    description: 'Digestion enzyme information',
    category: SdrfColumnCategory.MODIFICATIONS,
    isRequired: true
  },

  // Mass tolerances
  {
    name: 'comment[fragment mass tolerance]',
    type: ColumnType.COMMENT,
    description: 'Fragment ion mass tolerance',
    category: SdrfColumnCategory.MASS_TOLERANCES
  },
  {
    name: 'comment[precursor mass tolerance]',
    type: ColumnType.COMMENT,
    description: 'Precursor ion mass tolerance',
    category: SdrfColumnCategory.MASS_TOLERANCES
  },

  // Additional technical parameters
  {
    name: 'comment[MS2 analyzer type]',
    type: ColumnType.COMMENT,
    description: 'MS2 analyzer type',
    category: SdrfColumnCategory.TECHNICAL_PARAMS
  },
  {
    name: 'comment[collision energy]',
    type: ColumnType.COMMENT,
    description: 'Collision energy used',
    category: SdrfColumnCategory.TECHNICAL_PARAMS
  },
  {
    name: 'comment[dissociation method]',
    type: ColumnType.COMMENT,
    description: 'Fragmentation method',
    category: SdrfColumnCategory.TECHNICAL_PARAMS
  },
  {
    name: 'comment[proteomics data acquisition method]',
    type: ColumnType.COMMENT,
    description: 'DDA, DIA, etc.',
    category: SdrfColumnCategory.TECHNICAL_PARAMS
  },
  {
    name: 'comment[MS1 scan range]',
    type: ColumnType.COMMENT,
    description: 'MS1 scan range for DIA',
    category: SdrfColumnCategory.TECHNICAL_PARAMS
  },
  {
    name: 'comment[scan window lower limit]',
    type: ColumnType.COMMENT,
    description: 'Scan window lower limit',
    category: SdrfColumnCategory.TECHNICAL_PARAMS
  },
  {
    name: 'comment[scan window upper limit]',
    type: ColumnType.COMMENT,
    description: 'Scan window upper limit',
    category: SdrfColumnCategory.TECHNICAL_PARAMS
  },

  // Sample preparation
  {
    name: 'comment[depletion]',
    type: ColumnType.COMMENT,
    description: 'Depletion method applied',
    category: SdrfColumnCategory.SAMPLE_PREP
  },
  {
    name: 'comment[reduction reagent]',
    type: ColumnType.COMMENT,
    description: 'Reduction reagent used',
    category: SdrfColumnCategory.SAMPLE_PREP
  },
  {
    name: 'comment[alkylation reagent]',
    type: ColumnType.COMMENT,
    description: 'Alkylation reagent used',
    category: SdrfColumnCategory.SAMPLE_PREP
  },
  {
    name: 'comment[fractionation method]',
    type: ColumnType.COMMENT,
    description: 'Fractionation method',
    category: SdrfColumnCategory.SAMPLE_PREP
  },

  // File and project information
  {
    name: 'comment[file uri]',
    type: ColumnType.COMMENT,
    description: 'Public URI of the file',
    category: SdrfColumnCategory.FILE_PROJECT
  },
  {
    name: 'comment[proteomexchange accession number]',
    type: ColumnType.COMMENT,
    description: 'ProteomeXchange accession',
    category: SdrfColumnCategory.FILE_PROJECT
  }
];

// Helper functions
export function getSdrfColumnsByCategory(category?: SdrfColumnCategory): SdrfColumnConfig[] {
  if (!category) {
    return OFFICIAL_SDRF_COLUMNS;
  }
  return OFFICIAL_SDRF_COLUMNS.filter(col => col.category === category);
}

export function getRequiredSdrfColumns(): SdrfColumnConfig[] {
  return OFFICIAL_SDRF_COLUMNS.filter(col => col.isRequired === true);
}

export function getSdrfColumnByName(name: string): SdrfColumnConfig | undefined {
  return OFFICIAL_SDRF_COLUMNS.find(col => col.name.toLowerCase() === name.toLowerCase());
}

export function isSdrfColumnRequired(name: string): boolean {
  const column = getSdrfColumnByName(name);
  return column?.isRequired === true;
}