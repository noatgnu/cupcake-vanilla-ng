import { BaseResource } from './base';

export enum AnnotationType {
  Text = 'text',
  File = 'file',
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  Sketch = 'sketch',
  Other = 'other',
  Checklist = 'checklist',
  Counter = 'counter',
  Table = 'table',
  Alignment = 'alignment',
  Calculator = 'calculator',
  MolarityCalculator = 'mcalculator',
  Randomization = 'randomization',
  Metadata = 'metadata',
  Booking = 'booking'
}

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
  file?: string;
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
  canEdit?: boolean;
  canView?: boolean;
  canDelete?: boolean;
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
  transcribed?: boolean;
  transcription?: string;
  language?: string;
  translation?: string;
  labGroup?: number;
  visibility?: string;
  autoTranscribe?: boolean;
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