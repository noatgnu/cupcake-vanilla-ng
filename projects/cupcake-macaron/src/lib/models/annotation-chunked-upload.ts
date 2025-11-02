export interface AnnotationChunkedUploadRequest {
  file: File;
  filename?: string;
  annotation?: string;
  annotationType?: string;
  autoTranscribe?: boolean;
}

export interface InstrumentAnnotationChunkedUploadRequest extends AnnotationChunkedUploadRequest {
  instrumentId: number;
  folderId: number;
}

export interface StoredReagentAnnotationChunkedUploadRequest extends AnnotationChunkedUploadRequest {
  storedReagentId: number;
  folderId: number;
}

export interface MaintenanceLogAnnotationChunkedUploadRequest extends AnnotationChunkedUploadRequest {
  maintenanceLogId: number;
}

export interface InstrumentJobAnnotationChunkedUploadRequest extends AnnotationChunkedUploadRequest {
  instrumentJobId: number;
  folderId?: number;
  role?: 'user' | 'staff';
}

export interface AnnotationChunkedUploadResponse {
  id: string;
  filename: string;
  offset: number;
  expires: string;
  url?: string;
  checksum?: string;
}

export interface AnnotationChunkedUploadCompletionRequest {
  sha256: string;
  autoTranscribe?: boolean;
}

export interface InstrumentAnnotationChunkedUploadCompletionRequest extends AnnotationChunkedUploadCompletionRequest {
  instrumentId: number;
  folderId: number;
  annotation?: string;
  annotationType?: string;
}

export interface StoredReagentAnnotationChunkedUploadCompletionRequest extends AnnotationChunkedUploadCompletionRequest {
  storedReagentId: number;
  folderId: number;
  annotation?: string;
  annotationType?: string;
}

export interface MaintenanceLogAnnotationChunkedUploadCompletionRequest extends AnnotationChunkedUploadCompletionRequest {
  maintenanceLogId: number;
  annotation?: string;
  annotationType?: string;
}

export interface InstrumentJobAnnotationChunkedUploadCompletionRequest extends AnnotationChunkedUploadCompletionRequest {
  instrumentJobId: number;
  folderId?: number;
  annotation?: string;
  annotationType?: string;
  role?: 'user' | 'staff';
}

export interface AnnotationChunkedUploadCompletionResponse {
  annotationId?: number;
  instrumentAnnotationId?: number;
  instrumentJobAnnotationId?: number;
  storedReagentAnnotationId?: number;
  maintenanceLogAnnotationId?: number;
  message?: string;
  warning?: string;
  error?: string;
}
