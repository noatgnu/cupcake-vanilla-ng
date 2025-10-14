export interface AnnotationChunkedUploadRequest {
  file: File;
  filename?: string;
  annotation?: string;
  annotationType?: string;
}

export interface InstrumentAnnotationChunkedUploadRequest extends AnnotationChunkedUploadRequest {
  instrumentId: number;
  folderId: number;
}

export interface StoredReagentAnnotationChunkedUploadRequest extends AnnotationChunkedUploadRequest {
  storedReagentId: number;
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

export interface AnnotationChunkedUploadCompletionResponse {
  annotationId?: number;
  instrumentAnnotationId?: number;
  storedReagentAnnotationId?: number;
  message?: string;
  warning?: string;
  error?: string;
}
