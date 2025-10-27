export interface InstrumentAnnotation {
  id: number;
  instrument: number;
  instrumentName: string;
  folder: number;
  folderName: string;
  annotation: number;
  annotationName: string;
  annotationType: string;
  annotationText?: string;
  transcribed?: boolean;
  transcription?: string;
  language?: string;
  translation?: string;
  scratched?: boolean;
  fileUrl?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredReagentAnnotation {
  id: number;
  storedReagent: number;
  storedReagentName?: string;
  folder: number;
  folderName: string;
  annotation: number;
  annotationName: string;
  annotationType: string;
  annotationText?: string;
  transcribed?: boolean;
  transcription?: string;
  language?: string;
  translation?: string;
  scratched?: boolean;
  fileUrl?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceLogAnnotation {
  id: number;
  maintenanceLog: number;
  maintenanceLogTitle?: string;
  annotation: number;
  annotationName: string;
  annotationType: string;
  annotationText?: string;
  transcribed?: boolean;
  transcription?: string;
  language?: string;
  translation?: string;
  scratched?: boolean;
  fileUrl?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface InstrumentAnnotationQueryParams {
  instrument?: number;
  folder?: number;
  annotation?: number;
  scratched?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface StoredReagentAnnotationQueryParams {
  storedReagent?: number;
  folder?: number;
  annotation?: number;
  scratched?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface MaintenanceLogAnnotationQueryParams {
  maintenanceLog?: number;
  annotation?: number;
  scratched?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface AnnotationDataRequest {
  annotation: string;
  annotationType?: string;
  transcription?: string;
  language?: string;
  translation?: string;
  scratched?: boolean;
}

export interface InstrumentAnnotationCreateRequest {
  instrument: number;
  folder: number;
  annotation?: number;
  annotationData?: AnnotationDataRequest;
  order?: number;
}

export interface StoredReagentAnnotationCreateRequest {
  storedReagent: number;
  folder: number;
  annotation?: number;
  annotationData?: AnnotationDataRequest;
  order?: number;
}

export interface MaintenanceLogAnnotationCreateRequest {
  maintenanceLog: number;
  annotation?: number;
  annotationData?: AnnotationDataRequest;
  order?: number;
}

export interface InstrumentAnnotationUpdateRequest {
  annotationData?: Partial<AnnotationDataRequest>;
  order?: number;
}

export interface StoredReagentAnnotationUpdateRequest {
  annotationData?: Partial<AnnotationDataRequest>;
  order?: number;
}

export interface MaintenanceLogAnnotationUpdateRequest {
  annotationData?: Partial<AnnotationDataRequest>;
  order?: number;
}
