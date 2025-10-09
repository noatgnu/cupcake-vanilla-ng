import { BaseTimestampedModel } from './base';

export interface Reagent extends BaseTimestampedModel {
  id: number;
  name: string;
  unit?: string;
}

export interface StoredReagent extends BaseTimestampedModel {
  id: number;
  reagent: number;
  reagentName?: string;
  reagentUnit?: string;
  storageObject?: number;
  storageObjectName?: string;
  quantity: number;
  currentQuantity: number;
  notes?: string;
  user?: number;
  pngBase64?: string;
  barcode?: string;
  shareable: boolean;
  accessUsers?: number[];
  accessLabGroups?: number[];
  accessAll: boolean;
  expirationDate?: string;
  lowStockThreshold?: number;
  notifyOnLowStock: boolean;
  lastNotificationSent?: string;
  metadataTable?: number;
  metadataTableName?: string;
  metadataTableId?: number;
}

export interface ReagentCreateRequest {
  name: string;
  unit?: string;
}

export interface ReagentUpdateRequest {
  name?: string;
  unit?: string;
}

export interface StoredReagentCreateRequest {
  reagent: number;
  storageObject?: number;
  quantity: number;
  notes?: string;
  pngBase64?: string;
  barcode?: string;
  shareable?: boolean;
  accessUsers?: number[];
  accessLabGroups?: number[];
  accessAll?: boolean;
  expirationDate?: string;
  lowStockThreshold?: number;
  notifyOnLowStock?: boolean;
  metadataTable?: number;
}

export interface StoredReagentUpdateRequest {
  storageObject?: number;
  currentQuantity?: number;
  notes?: string;
  pngBase64?: string;
  barcode?: string;
  shareable?: boolean;
  accessUsers?: number[];
  accessLabGroups?: number[];
  accessAll?: boolean;
  expirationDate?: string;
  lowStockThreshold?: number;
  notifyOnLowStock?: boolean;
  metadataTable?: number;
}