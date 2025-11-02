export type InstrumentJobAnnotationRole = 'user' | 'staff';

export interface InstrumentJobAnnotation {
  id: number;
  instrumentJob: number;
  instrumentJobName?: string;
  folder?: number;
  folderName?: string;
  annotation: number;
  annotationName?: string;
  annotationType?: string;
  annotationText?: string;
  annotationUser?: string;
  transcribed?: boolean;
  transcription?: string;
  language?: string;
  translation?: string;
  scratched?: boolean;
  fileUrl?: string;
  role: InstrumentJobAnnotationRole;
  order: number;
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface InstrumentJobAnnotationCreateRequest {
  instrumentJob: number;
  folder?: number;
  annotation?: number;
  annotationData?: {
    annotation: string;
    annotationType?: string;
    transcription?: string;
    language?: string;
    translation?: string;
    scratched?: boolean;
    autoTranscribe?: boolean;
  };
  role?: InstrumentJobAnnotationRole;
  order?: number;
}

export interface InstrumentJobAnnotationUpdateRequest {
  folder?: number;
  order?: number;
  annotationText?: string;
  transcription?: string;
  language?: string;
  translation?: string;
  scratched?: boolean;
}

export interface InstrumentJobAnnotationQueryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: InstrumentJobAnnotation[];
}
