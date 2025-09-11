import { ResourceType, ResourceVisibility, ResourceRole } from './enums';

export interface BaseTimestampedModel {
  createdAt: string;
  updatedAt: string;
}

export interface BaseResource extends BaseTimestampedModel {
  id: number;
  resourceType: ResourceType;
  owner?: number;
  labGroup?: number;
  visibility: ResourceVisibility;
  isActive: boolean;
  isLocked: boolean;
  canEdit?: boolean;
  canView?: boolean;
  canDelete?: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: any;
  status: number;
  success: boolean;
}

export interface ResourceQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  visibility?: ResourceVisibility;
  owner?: number;
  labGroup?: number;
  includeInactive?: boolean;
}