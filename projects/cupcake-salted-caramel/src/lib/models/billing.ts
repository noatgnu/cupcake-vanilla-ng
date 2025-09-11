import { BaseTimestampedModel, UserBasic } from './base';
import { BillingUnit, BillingStatus } from './enums';

export interface ServiceTier extends BaseTimestampedModel {
  id: number;
  tierName: string;
  description?: string;
  priorityLevel: number;
  features: string[];
  featuresDisplay?: string;
  maxConcurrentBookings?: number;
  advanceBookingDays: number;
  baseRateMultiplier: number;
  discountPercentage: number;
  isActive: boolean;
  activePricesCount: number;
}

export interface BillableItemType extends BaseTimestampedModel {
  id: number;
  name: string;
  description?: string;
  contentType: number;
  contentTypeDisplay?: string;
  appLabel?: string;
  defaultBillingUnit: BillingUnit;
  defaultBillingUnitDisplay?: string;
  requiresApproval: boolean;
  isActive: boolean;
  activePricesCount: number;
}

export interface ServicePrice extends BaseTimestampedModel {
  id: number;
  billableItemType: number;
  billableItemName?: string;
  serviceTier: number;
  serviceTierName?: string;
  basePrice: number;
  currency: string;
  billingUnit: BillingUnit;
  billingUnitDisplay?: string;
  minimumChargeUnits: number;
  setupFee: number;
  bulkThreshold?: number;
  bulkDiscountPercentage: number;
  effectiveFrom: string;
  effectiveUntil?: string;
  isActive: boolean;
  isCurrent: boolean;
}

export interface BillingRecord extends BaseTimestampedModel {
  id: string;
  contentType: number;
  contentTypeDisplay?: string;
  appLabel?: string;
  objectId: number;
  user: number;
  username?: string;
  userEmail?: string;
  serviceTier: number;
  serviceTierName?: string;
  servicePrice: number;
  billableItemName?: string;
  billingUnitDisplay?: string;
  quantity: number;
  unitPrice: number;
  setupFee: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: BillingStatus;
  statusDisplay?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  description?: string;
  notes?: string;
  costCenter?: string;
  funder?: string;
  approvedAt?: string;
  approvedBy?: number;
  approvedByUsername?: string;
  canBeModified: boolean;
  costBreakdown: CostBreakdown;
  billingPeriodDays: number;
}

export interface CostBreakdown {
  unitPrice: number;
  subtotal: number;
  setupFee: number;
  bulkDiscount: number;
  taxAmount: number;
  total: number;
  currency: string;
}

export interface ServiceTierCreateRequest {
  tierName: string;
  description?: string;
  priorityLevel?: number;
  features?: string[];
  maxConcurrentBookings?: number;
  advanceBookingDays?: number;
  baseRateMultiplier?: number;
  discountPercentage?: number;
  isActive?: boolean;
}

export interface ServiceTierUpdateRequest {
  tierName?: string;
  description?: string;
  priorityLevel?: number;
  features?: string[];
  maxConcurrentBookings?: number;
  advanceBookingDays?: number;
  baseRateMultiplier?: number;
  discountPercentage?: number;
  isActive?: boolean;
}

export interface BillableItemTypeCreateRequest {
  name: string;
  description?: string;
  contentType: number;
  defaultBillingUnit?: BillingUnit;
  requiresApproval?: boolean;
  isActive?: boolean;
}

export interface BillableItemTypeUpdateRequest {
  name?: string;
  description?: string;
  defaultBillingUnit?: BillingUnit;
  requiresApproval?: boolean;
  isActive?: boolean;
}

export interface ServicePriceCreateRequest {
  billableItemType: number;
  serviceTier: number;
  basePrice: number;
  currency?: string;
  billingUnit: BillingUnit;
  minimumChargeUnits?: number;
  setupFee?: number;
  bulkThreshold?: number;
  bulkDiscountPercentage?: number;
  effectiveFrom?: string;
  effectiveUntil?: string;
  isActive?: boolean;
}

export interface ServicePriceUpdateRequest {
  basePrice?: number;
  currency?: string;
  billingUnit?: BillingUnit;
  minimumChargeUnits?: number;
  setupFee?: number;
  bulkThreshold?: number;
  bulkDiscountPercentage?: number;
  effectiveFrom?: string;
  effectiveUntil?: string;
  isActive?: boolean;
}

export interface BillingRecordCreateRequest {
  contentType: number;
  objectId: number;
  user: number;
  serviceTier: number;
  servicePrice: number;
  quantity: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  description?: string;
  notes?: string;
  costCenter?: string;
  funder?: string;
}

export interface BillingRecordUpdateRequest {
  status?: BillingStatus;
  description?: string;
  notes?: string;
  costCenter?: string;
  funder?: string;
}

export interface ServicePriceCalculationRequest {
  quantity: number;
  applyBulkDiscount?: boolean;
}

export interface BillingRecordSummary {
  totalRecords: number;
  totalAmount: number;
  currency: string;
  byStatus: { [key: string]: number };
  byPeriod: { [key: string]: number };
  averageAmount: number;
}

export interface BillingApprovalRequest {
  notes?: string;
}