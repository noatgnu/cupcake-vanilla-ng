import { BaseTimestampedModel } from './base';

export interface SupportInformation extends BaseTimestampedModel {
  id: number;
  vendorName?: string;
  vendorContacts?: number[];
  manufacturerName?: string;
  manufacturerContacts?: number[];
  serialNumber?: string;
  maintenanceFrequencyDays?: number;
  location?: number;
  locationName?: string;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
}

export interface SupportInformationCreateRequest {
  vendorName?: string;
  vendorContacts?: number[];
  manufacturerName?: string;
  manufacturerContacts?: number[];
  serialNumber?: string;
  maintenanceFrequencyDays?: number;
  location?: number;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
}

export interface SupportInformationUpdateRequest {
  vendorName?: string;
  vendorContacts?: number[];
  manufacturerName?: string;
  manufacturerContacts?: number[];
  serialNumber?: string;
  maintenanceFrequencyDays?: number;
  location?: number;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
}