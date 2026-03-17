import { BaseResource } from '@noatgnu/cupcake-core';

export interface BaseTimestampedModel {
  createdAt: string;
  updatedAt: string;
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

export interface InstrumentQueryParams {
  limit?: number;
  offset?: number;
  search?: string;
  ordering?: string;
  enabled?: boolean;
  user?: number;
  includeVaulted?: boolean;
}