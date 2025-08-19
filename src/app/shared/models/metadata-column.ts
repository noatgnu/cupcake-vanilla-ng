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
  value: string;
  display_value?: string;
  is_global?: boolean;
  user?: number;
  lab_group?: number;
}
