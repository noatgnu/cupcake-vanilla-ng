import { BaseTimestampedModel } from './base';

export interface ReagentSubscription extends BaseTimestampedModel {
  id: number;
  user: number;
  userUsername?: string;
  storedReagent: number;
  reagentName?: string;
  notifyOnLowStock: boolean;
  notifyOnExpiry: boolean;
}

export interface ReagentSubscriptionCreateRequest {
  storedReagent: number;
  notifyOnLowStock?: boolean;
  notifyOnExpiry?: boolean;
}

export interface ReagentSubscriptionUpdateRequest {
  notifyOnLowStock?: boolean;
  notifyOnExpiry?: boolean;
}