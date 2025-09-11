import { BaseResource } from './base';

export interface AnnotationFolder extends BaseResource {
  folderName: string;
  parentFolder?: number;
  isSharedDocumentFolder: boolean;
  ownerName?: string;
  fullPath?: string;
  childFoldersCount: number;
  annotationsCount: number;
}

export interface Annotation extends BaseResource {
  annotation: string;
  annotationType: string;
  file?: number;
  fileUrl?: string;
  fileSize?: number;
  folder?: number;
  folderPath?: string;
  transcribed: boolean;
  transcription?: string;
  language?: string;
  translation?: string;
  scratched: boolean;
  ownerName?: string;
}

export interface AnnotationFolderCreateRequest {
  folderName: string;
  parentFolder?: number;
  isSharedDocumentFolder?: boolean;
  labGroup?: number;
  visibility?: string;
}

export interface AnnotationFolderUpdateRequest {
  folderName?: string;
  parentFolder?: number;
  isSharedDocumentFolder?: boolean;
  isActive?: boolean;
}

export interface AnnotationCreateRequest {
  annotation: string;
  annotationType?: string;
  file?: File;
  folder?: number;
  language?: string;
  labGroup?: number;
  visibility?: string;
}

export interface AnnotationUpdateRequest {
  annotation?: string;
  annotationType?: string;
  folder?: number;
  transcribed?: boolean;
  transcription?: string;
  language?: string;
  translation?: string;
  scratched?: boolean;
}