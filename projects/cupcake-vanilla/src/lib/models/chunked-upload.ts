export interface ChunkedUploadStatus {
  id: string;
  file?: File;
  filename?: string;
  offset: number;
  createdAt: string;
  status: 'INCOMPLETE' | 'COMPLETE';
  completedAt?: string;
  originalFilename?: string;
  mimeType?: string;
  fileSize?: number;
  uploadSessionId?: string;
  checksum?: string;
}

export interface ChunkedUploadRequest {
  file: File;
  filename?: string;
  uploadSessionId?: string;
  metadataTableId?: number;
  createPools?: boolean;
  replaceExisting?: boolean;
}

export interface ChunkedUploadResponse {
  id: string;
  filename: string;
  offset: number;
  expires: string;
  url?: string;
  checksum?: string;
}

export interface ChunkedUploadCompletionRequest {
  sha256: string;
  metadataTableId?: number;
  createPools?: boolean;
  replaceExisting?: boolean;
}

export interface ChunkedUploadCompletionResponse {
  message: string;
  filename?: string;
  warning?: string;
  error?: string;
  createdColumns?: number;
  createdPools?: number;
  sampleRows?: number;
  metadataColumns?: Array<{
    id: number;
    name: string;
    type: string;
    position: number;
  }>;
  samplePools?: Array<{
    id: number;
    name: string;
    totalSamples: number;
    isReference: boolean;
  }>;
}