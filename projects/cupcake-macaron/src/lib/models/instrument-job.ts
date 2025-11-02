import { BaseTimestampedModel } from './base';
import { JobType, Status, SampleType } from './enums';

export interface InstrumentJob extends BaseTimestampedModel {
  id: number;
  user?: number;
  userUsername?: string;
  instrument?: number;
  instrumentName?: string;
  instrumentUsage?: number;
  labGroup?: number;
  labGroupName?: string;
  project?: number;
  projectName?: string;
  jobType: JobType;
  jobTypeDisplay?: string;
  jobName?: string;
  status: Status;
  statusDisplay?: string;
  sampleNumber?: number;
  sampleType?: SampleType;
  sampleTypeDisplay?: string;
  injectionVolume?: number;
  injectionUnit?: string;
  searchEngine?: string;
  searchEngineVersion?: string;
  searchDetails?: string;
  method?: string;
  location?: string;
  funder?: string;
  costCenter?: string;
  assigned: boolean;
  staff?: number[];
  staffUsernames?: string[];
  metadataTableTemplate?: number;
  metadataTableTemplateName?: string;
  metadataTable?: number;
  metadataTableName?: string;
  userAnnotations?: any[];
  staffAnnotations?: any[];
  storedReagent?: number;
  instrumentStartTime?: string;
  instrumentEndTime?: string;
  personnelStartTime?: string;
  personnelEndTime?: string;
  submittedAt?: string;
  completedAt?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canEditMetadata?: boolean;
  canEditStaffOnlyColumns?: boolean;
}

export interface InstrumentJobCreateRequest {
  instrument?: number;
  jobType: JobType;
  labGroup?: number;
  project?: number;
  jobName?: string;
  sampleNumber?: number;
  sampleType?: SampleType;
  injectionVolume?: number;
  injectionUnit?: string;
  searchEngine?: string;
  searchEngineVersion?: string;
  searchDetails?: string;
  method?: string;
  location?: string;
  funder?: string;
  costCenter?: string;
  staff?: number[];
  metadataTableTemplate?: number;
  metadataTable?: number;
  storedReagent?: number;
}

export interface InstrumentJobUpdateRequest {
  labGroup?: number;
  project?: number;
  jobName?: string;
  status?: Status;
  sampleNumber?: number;
  sampleType?: SampleType;
  injectionVolume?: number;
  injectionUnit?: string;
  searchEngine?: string;
  searchEngineVersion?: string;
  searchDetails?: string;
  method?: string;
  location?: string;
  funder?: string;
  costCenter?: string;
  assigned?: boolean;
  staff?: number[];
  metadataTableTemplate?: number;
  storedReagent?: number;
  instrumentStartTime?: string;
  instrumentEndTime?: string;
  personnelStartTime?: string;
  personnelEndTime?: string;
}

export interface InstrumentUsageJobAnnotation {
  id: number;
  instrumentJobAnnotation: number;
  instrumentJobAnnotationDetails?: any;
  instrumentUsage: number;
  instrumentName?: string;
  jobName?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}