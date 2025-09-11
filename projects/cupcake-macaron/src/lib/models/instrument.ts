import { BaseTimestampedModel } from './base';

export interface Instrument extends BaseTimestampedModel {
  id: number;
  instrumentName: string;
  instrumentDescription?: string;
  image?: string;
  enabled: boolean;
  remoteId?: number;
  remoteHost?: number;
  remoteHostName?: string;
  maxDaysAheadPreApproval?: number;
  maxDaysWithinUsagePreApproval?: number;
  supportInformation?: number;
  supportInformationCount?: number;
  lastWarrantyNotificationSent?: string;
  lastMaintenanceNotificationSent?: string;
  daysBeforeWarrantyNotification?: number;
  daysBeforeMaintenanceNotification?: number;
  acceptsBookings: boolean;
  user?: number;
  ownerUsername?: string;
  isVaulted: boolean;
  metadataTable?: number;
  metadataTableName?: string;
  metadataTableId?: number;
}

export interface InstrumentCreateRequest {
  instrumentName: string;
  instrumentDescription?: string;
  image?: File;
  enabled?: boolean;
  remoteId?: number;
  remoteHost?: number;
  maxDaysAheadPreApproval?: number;
  maxDaysWithinUsagePreApproval?: number;
  daysBeforeWarrantyNotification?: number;
  daysBeforeMaintenanceNotification?: number;
  acceptsBookings?: boolean;
  metadataTable?: number;
}

export interface InstrumentUpdateRequest {
  instrumentName?: string;
  instrumentDescription?: string;
  image?: File;
  enabled?: boolean;
  maxDaysAheadPreApproval?: number;
  maxDaysWithinUsagePreApproval?: number;
  daysBeforeWarrantyNotification?: number;
  daysBeforeMaintenanceNotification?: number;
  acceptsBookings?: boolean;
  isVaulted?: boolean;
  metadataTable?: number;
}