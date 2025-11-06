export enum TaskStatus {
  QUEUED = 'QUEUED',
  STARTED = 'STARTED',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  CANCELLED = 'CANCELLED'
}

export enum TaskType {
  EXPORT_EXCEL = 'EXPORT_EXCEL',
  EXPORT_SDRF = 'EXPORT_SDRF',
  IMPORT_SDRF = 'IMPORT_SDRF',
  IMPORT_EXCEL = 'IMPORT_EXCEL',
  EXPORT_MULTIPLE_SDRF = 'EXPORT_MULTIPLE_SDRF',
  EXPORT_MULTIPLE_EXCEL = 'EXPORT_MULTIPLE_EXCEL',
  VALIDATE_TABLE = 'VALIDATE_TABLE',
  REORDER_TABLE_COLUMNS = 'REORDER_TABLE_COLUMNS',
  REORDER_TEMPLATE_COLUMNS = 'REORDER_TEMPLATE_COLUMNS',
  TRANSCRIBE_AUDIO = 'TRANSCRIBE_AUDIO',
  TRANSCRIBE_VIDEO = 'TRANSCRIBE_VIDEO'
}

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

export interface AsyncTaskQueryParams {
  taskType?: string;
  status?: string;
  metadataTable?: number;
  search?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  [TaskType.EXPORT_EXCEL]: 'Export Excel Template',
  [TaskType.EXPORT_SDRF]: 'Export SDRF File',
  [TaskType.IMPORT_SDRF]: 'Import SDRF File',
  [TaskType.IMPORT_EXCEL]: 'Import Excel File',
  [TaskType.EXPORT_MULTIPLE_SDRF]: 'Export Multiple SDRF Files',
  [TaskType.EXPORT_MULTIPLE_EXCEL]: 'Export Multiple Excel Templates',
  [TaskType.VALIDATE_TABLE]: 'Validate Metadata Table',
  [TaskType.REORDER_TABLE_COLUMNS]: 'Reorder Table Columns',
  [TaskType.REORDER_TEMPLATE_COLUMNS]: 'Reorder Template Columns',
  [TaskType.TRANSCRIBE_AUDIO]: 'Transcribe Audio',
  [TaskType.TRANSCRIBE_VIDEO]: 'Transcribe Video',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.QUEUED]: 'Queued',
  [TaskStatus.STARTED]: 'In Progress',
  [TaskStatus.SUCCESS]: 'Completed',
  [TaskStatus.FAILURE]: 'Failed',
  [TaskStatus.CANCELLED]: 'Cancelled',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.QUEUED]: 'secondary',
  [TaskStatus.STARTED]: 'primary',
  [TaskStatus.SUCCESS]: 'success',
  [TaskStatus.FAILURE]: 'danger',
  [TaskStatus.CANCELLED]: 'warning',
};
