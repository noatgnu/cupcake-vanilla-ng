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
  storedReagent?: number;
  instrumentStartTime?: string;
  instrumentEndTime?: string;
  personnelStartTime?: string;
  personnelEndTime?: string;
}