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

export interface ApiError {
  message?: string;
  code?: string;
  details?: Record<string, string[]>;
  [key: string]: unknown;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
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