import { BaseTimestampedModel } from './base';
import { MaintenanceType, Status } from './enums';

export interface MaintenanceLog extends BaseTimestampedModel {
  id: number;
  instrument: number;
  instrumentName?: string;
  maintenanceDate: string;
  maintenanceType: MaintenanceType;
  maintenanceTypeDisplay?: string;
  status: Status;
  statusDisplay?: string;
  maintenanceDescription?: string;
  maintenanceNotes?: string;
  createdBy?: number;
  createdByUsername?: string;
  isTemplate: boolean;
  annotationFolder?: number;
}

export interface MaintenanceLogCreateRequest {
  instrument: number;
  maintenanceDate: string;
  maintenanceType: MaintenanceType;
  maintenanceDescription?: string;
  maintenanceNotes?: string;
  isTemplate?: boolean;
  annotationFolder?: number;
}

export interface MaintenanceLogUpdateRequest {
  maintenanceDate?: string;
  maintenanceType?: MaintenanceType;
  status?: Status;
  maintenanceDescription?: string;
  maintenanceNotes?: string;
  isTemplate?: boolean;
  annotationFolder?: number;
}