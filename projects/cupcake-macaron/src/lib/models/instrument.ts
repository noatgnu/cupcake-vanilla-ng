import { BaseTimestampedModel } from './base';
import { SupportInformation } from './support-information';

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
  supportInformation?: number[];
  supportInformationCount?: number;
  lastWarrantyNotificationSent?: string;
  lastMaintenanceNotificationSent?: string;
  daysBeforeWarrantyNotification?: number;
  daysBeforeMaintenanceNotification?: number;
  acceptsBookings: boolean;
  allowOverlappingBookings: boolean;
  user?: number;
  ownerUsername?: string;
  isVaulted: boolean;
  metadataTable?: number;
  metadataTableName?: string;
  metadataTableId?: number;
  maintenanceOverdue: boolean;
}

export interface InstrumentDetail extends Omit<Instrument, 'supportInformation'> {
  supportInformation?: SupportInformation[];
}

export interface InstrumentCreateRequest {
  instrumentName: string;
  instrumentDescription?: string;
  image?: string;
  enabled?: boolean;
  remoteId?: number;
  remoteHost?: number;
  maxDaysAheadPreApproval?: number;
  maxDaysWithinUsagePreApproval?: number;
  daysBeforeWarrantyNotification?: number;
  daysBeforeMaintenanceNotification?: number;
  acceptsBookings?: boolean;
  allowOverlappingBookings?: boolean;
  metadataTable?: number;
}

export interface InstrumentUpdateRequest {
  instrumentName?: string;
  instrumentDescription?: string;
  image?: string;
  enabled?: boolean;
  maxDaysAheadPreApproval?: number;
  maxDaysWithinUsagePreApproval?: number;
  daysBeforeWarrantyNotification?: number;
  daysBeforeMaintenanceNotification?: number;
  acceptsBookings?: boolean;
  allowOverlappingBookings?: boolean;
  isVaulted?: boolean;
  supportInformation?: number[];
  metadataTable?: number;
}