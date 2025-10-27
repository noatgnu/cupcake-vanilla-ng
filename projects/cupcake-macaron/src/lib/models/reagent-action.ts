import { BaseTimestampedModel } from './base';

export enum ActionType {
  ADD = 'add',
  RESERVE = 'reserve'
}

export interface ReagentAction extends BaseTimestampedModel {
  id: number;
  actionType: ActionType;
  actionTypeDisplay?: string;
  reagent: number;
  reagentName?: string;
  quantity: number;
  notes?: string;
  user?: number;
  userUsername?: string;
  session?: number;
  sessionName?: string;
  step?: number;
  stepDescription?: string;
  isWithinDeletionWindow?: boolean;
  isDeletable?: boolean;
}

export interface ReagentActionCreateRequest {
  actionType: ActionType;
  reagent: number;
  quantity: number;
  notes?: string;
  session?: number;
  step?: number;
}

export interface ReagentActionUpdateRequest {
  actionType?: ActionType;
  quantity?: number;
  notes?: string;
  session?: number;
  step?: number;
}