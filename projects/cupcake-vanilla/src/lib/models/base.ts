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

export interface ApiResponse<T = any> {
  data?: T;
  error?: any;
  status: number;
  success: boolean;
}

export interface MetadataQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  owner?: number;
  labGroup?: number;
  isPublished?: boolean;
  includeLocked?: boolean;
}