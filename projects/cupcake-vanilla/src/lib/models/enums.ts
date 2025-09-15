export enum OntologyType {
  NONE = '',
  SPECIES = 'species',
  TISSUE = 'tissue',
  HUMAN_DISEASE = 'human_disease',
  SUBCELLULAR_LOCATION = 'subcellular_location',
  UNIMOD = 'unimod',
  NCBI_TAXONOMY = 'ncbi_taxonomy',
  MONDO = 'mondo',
  UBERON = 'uberon',
  CHEBI = 'chebi',
  CELL_ONTOLOGY = 'cell_ontology',
  MS_UNIQUE_VOCABULARIES = 'ms_unique_vocabularies',
  PSI_MS = 'psi_ms'
}

export const OntologyTypeLabels: Record<OntologyType, string> = {
  [OntologyType.NONE]: 'None',
  [OntologyType.SPECIES]: 'Species',
  [OntologyType.TISSUE]: 'Tissue',
  [OntologyType.HUMAN_DISEASE]: 'Human Disease',
  [OntologyType.SUBCELLULAR_LOCATION]: 'Subcellular Location',
  [OntologyType.UNIMOD]: 'Unimod Modifications',
  [OntologyType.NCBI_TAXONOMY]: 'NCBI Taxonomy',
  [OntologyType.MONDO]: 'MONDO Disease',
  [OntologyType.UBERON]: 'UBERON Anatomy',
  [OntologyType.CHEBI]: 'ChEBI',
  [OntologyType.CELL_ONTOLOGY]: 'Cell Ontology',
  [OntologyType.MS_UNIQUE_VOCABULARIES]: 'MS Unique Vocabularies',
  [OntologyType.PSI_MS]: 'PSI-MS Controlled Vocabulary'
};

export enum TemplatePermissionLevel {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

export const TemplatePermissionLabels: Record<TemplatePermissionLevel, string> = {
  [TemplatePermissionLevel.READ]: 'Read Only',
  [TemplatePermissionLevel.WRITE]: 'Read & Write',
  [TemplatePermissionLevel.ADMIN]: 'Administrator'
};

export enum ColumnType {
  CHARACTERISTICS = 'characteristics',
  COMMENT = 'comment',
  FACTOR_VALUE = 'factor_value',
  SOURCE_NAME = 'source_name',
  SPECIAL = 'special'
}