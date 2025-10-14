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
  fileUrl?: string;
  createdAt: string;
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
  fileUrl?: string;
  createdAt: string;
}

export interface MaintenanceLogAnnotation {
  id: number;
  maintenanceLog: number;
  maintenanceLogDescription?: string;
  folder: number;
  folderName: string;
  annotation: number;
  annotationName: string;
  annotationType: string;
  annotationText?: string;
  fileUrl?: string;
  createdAt: string;
}

export interface InstrumentAnnotationQueryParams {
  instrument?: number;
  folder?: number;
  annotation?: number;
  search?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface StoredReagentAnnotationQueryParams {
  storedReagent?: number;
  folder?: number;
  annotation?: number;
  search?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface MaintenanceLogAnnotationQueryParams {
  maintenanceLog?: number;
  folder?: number;
  annotation?: number;
  search?: string;
  limit?: number;
  offset?: number;
  ordering?: string;
}
