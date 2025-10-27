import { BaseTimestampedModel } from './base';
import { ExternalContact } from './contact';

export interface SupportInformation extends BaseTimestampedModel {
  id: number;
  vendorName?: string;
  vendorContacts?: ExternalContact[];
  manufacturerName?: string;
  manufacturerContacts?: ExternalContact[];
  serialNumber?: string;
  maintenanceFrequencyDays?: number;
  location?: number;
  locationName?: string;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
}

export interface SupportInformationCreateRequest {
  vendorName?: string;
  vendorContactsIds?: number[];
  manufacturerName?: string;
  manufacturerContactsIds?: number[];
  serialNumber?: string;
  maintenanceFrequencyDays?: number;
  location?: number;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
}

export interface SupportInformationUpdateRequest {
  vendorName?: string;
  vendorContactsIds?: number[];
  manufacturerName?: string;
  manufacturerContactsIds?: number[];
  serialNumber?: string;
  maintenanceFrequencyDays?: number;
  location?: number;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
}