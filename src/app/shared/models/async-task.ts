/**
 * Models for async task management
 */

export type TaskStatus = 'QUEUED' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'CANCELLED';

export type TaskType = 'EXPORT_EXCEL' | 'EXPORT_SDRF' | 'IMPORT_SDRF' | 'IMPORT_EXCEL' | 'EXPORT_MULTIPLE_SDRF' | 'EXPORT_MULTIPLE_EXCEL' | 'VALIDATE_TABLE';

export interface AsyncTask {
  id: string;
  task_type: TaskType;
  status: TaskStatus;
  metadata_table_id: number | null;
  metadata_table_name: string | null;
  parameters: Record<string, any>;
  result: Record<string, any>;
  progress_percentage: number;
  progress_description: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  duration: number | null;
  error_message: string | null;
  traceback: string | null;
}

export interface TaskListItem {
  id: string;
  task_type: TaskType;
  status: TaskStatus;
  metadata_table_id: number | null;
  metadata_table_name: string | null;
  progress_percentage: number;
  progress_description: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  duration: number | null;
  error_message: string | null;
  result?: Record<string, any>;
}

export interface TaskCreateRequest {
  metadata_table_id: number;
  include_pools?: boolean;
  metadata_column_ids?: number[];
  sample_number?: number;
  export_format?: string;
  lab_group_ids?: number[];
}

export interface TaskCreateResponse {
  task_id: string;
  message: string;
}

export interface ImportTaskCreateRequest {
  metadata_table_id: number;
  file: File;
  replace_existing?: boolean;
  validate_ontologies?: boolean;
}

export interface BulkExportTaskCreateRequest {
  metadata_table_ids: number[];
  include_pools?: boolean;
  validate_sdrf?: boolean;
}

export interface BulkExcelExportTaskCreateRequest {
  metadata_table_ids: number[];
  metadata_column_ids?: number[];
  include_pools?: boolean;
  lab_group_ids?: number[];
}

export interface ValidationTaskCreateRequest {
  metadata_table_id: number;
  validate_sdrf_format?: boolean;
}

export interface MetadataValidationConfig {
  metadata_table_id: number;
  metadata_table_name: string;
}

export interface TaskProgressEvent {
  task_id: string;
  status: TaskStatus;
  progress_percentage: number;
  progress_description: string;
  error_message?: string;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  'EXPORT_EXCEL': 'Export Excel Template',
  'EXPORT_SDRF': 'Export SDRF File',
  'IMPORT_SDRF': 'Import SDRF File',
  'IMPORT_EXCEL': 'Import Excel File',
  'EXPORT_MULTIPLE_SDRF': 'Bulk Export SDRF Files',
  'EXPORT_MULTIPLE_EXCEL': 'Bulk Export Excel Templates',
  'VALIDATE_TABLE': 'Validate Metadata Table',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  'QUEUED': 'Queued',
  'STARTED': 'In Progress',
  'SUCCESS': 'Completed',
  'FAILURE': 'Failed',
  'CANCELLED': 'Cancelled',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  'QUEUED': 'secondary',
  'STARTED': 'primary',
  'SUCCESS': 'success',
  'FAILURE': 'danger',
  'CANCELLED': 'warning',
};