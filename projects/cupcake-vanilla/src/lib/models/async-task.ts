// Task status and type definitions
export type TaskStatus = 'QUEUED' | 'STARTED' | 'SUCCESS' | 'FAILURE' | 'CANCELLED';

export type TaskType =
  | 'EXPORT_EXCEL'
  | 'EXPORT_SDRF'
  | 'IMPORT_SDRF'
  | 'IMPORT_EXCEL'
  | 'EXPORT_MULTIPLE_SDRF'
  | 'EXPORT_MULTIPLE_EXCEL'
  | 'VALIDATE_TABLE'
  | 'REORDER_TABLE_COLUMNS'
  | 'REORDER_TEMPLATE_COLUMNS';

export interface AsyncTaskStatus {
  id: string;
  taskType: TaskType;
  status: TaskStatus;
  user: number;
  userUsername?: string;
  metadataTable?: number;
  metadataTableName?: string;
  taskTypeDisplay?: string;
  statusDisplay?: string;
  parameters?: any;
  result?: any;
  errorMessage?: string;
  traceback?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  rqJobId?: string;
  queueName?: string;
  progressCurrent?: number;
  progressTotal?: number;
  progressDescription?: string;
  duration?: number;
  progressPercentage?: number;
}

export interface TaskListItem {
  id: string;
  taskType: TaskType;
  taskTypeDisplay: string;
  status: TaskStatus;
  statusDisplay: string;
  user: number;
  userUsername: string;
  metadataTable: number | null;
  metadataTableName: string | null;
  progressPercentage: number;
  progressDescription: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  errorMessage: string | null;
}

export interface TaskResult {
  id: number;
  task: string;
  file?: string;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  expiresAt: string;
  downloadCount?: number;
  lastDownloadedAt?: string;
  createdAt: string;
}

// Async Task Request/Response Interfaces
export interface MetadataExportRequest {
  metadataTableId: number;
  includePools?: boolean;
  metadataColumnIds?: number[];
  sampleNumber?: number;
  exportFormat?: string;
  labGroupIds?: number[];
}

export interface BulkExportRequest {
  metadataTableIds: number[];
  includePools?: boolean;
  validateSdrf?: boolean;
}

export interface BulkExcelExportRequest extends BulkExportRequest {
  metadataColumnIds?: number[];
  labGroupIds?: number[];
}

export interface MetadataImportRequest {
  metadataTableId: number;
  file: File;
  replaceExisting?: boolean;
  validateOntologies?: boolean;
}

export interface ChunkedImportRequest {
  metadataTableId: number;
  chunkedUploadId: string;
  replaceExisting?: boolean;
  validateOntologies?: boolean;
  createPools?: boolean;
}

export interface MetadataValidationRequest {
  metadataTableId: number;
  validateSdrfFormat?: boolean;
  includePools?: boolean;
}

export interface MetadataValidationConfig {
  metadataTableId: number;
  metadataTableName: string;
}

export interface AsyncTaskCreateResponse {
  taskId: string;
  message: string;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
  filename: string;
  contentType: string;
  fileSize: number;
  expiresAt: string;
  expiresInHours: number;
}

// Query parameters for async tasks
export interface AsyncTaskQueryParams {
  taskType?: string;
  status?: string;
  metadataTable?: number;
  search?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}

// Helper constants
export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  'EXPORT_EXCEL': 'Export Excel Template',
  'EXPORT_SDRF': 'Export SDRF File',
  'IMPORT_SDRF': 'Import SDRF File',
  'IMPORT_EXCEL': 'Import Excel File',
  'EXPORT_MULTIPLE_SDRF': 'Export Multiple SDRF Files',
  'EXPORT_MULTIPLE_EXCEL': 'Export Multiple Excel Templates',
  'VALIDATE_TABLE': 'Validate Metadata Table',
  'REORDER_TABLE_COLUMNS': 'Reorder Table Columns',
  'REORDER_TEMPLATE_COLUMNS': 'Reorder Template Columns',
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