export interface AnnotationChunkedUploadRequest {
  file: File;
  filename?: string;
  annotation?: string;
  annotationType?: string;
}

export interface StepAnnotationChunkedUploadRequest extends AnnotationChunkedUploadRequest {
  sessionId: number;
  stepId: number;
  folderId?: number;
}

export interface SessionAnnotationFolderChunkedUploadRequest extends AnnotationChunkedUploadRequest {
  sessionId: number;
  folderId: number;
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
}

export interface StepAnnotationChunkedUploadCompletionRequest extends AnnotationChunkedUploadCompletionRequest {
  sessionId: number;
  stepId: number;
  folderId?: number;
  annotation?: string;
  annotationType?: string;
}

export interface SessionAnnotationFolderChunkedUploadCompletionRequest extends AnnotationChunkedUploadCompletionRequest {
  sessionId: number;
  folderId: number;
  annotation?: string;
  annotationType?: string;
}

export interface AnnotationChunkedUploadCompletionResponse {
  annotationId?: number;
  stepAnnotationId?: number;
  sessionAnnotationFolderId?: number;
  message?: string;
  warning?: string;
  error?: string;
}
