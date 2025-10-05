import { BaseResource } from '@noatgnu/cupcake-core';

export interface BaseTimestampedModel {
  createdAt: string;
  updatedAt: string;
}

export interface RemoteSystemModel extends BaseTimestampedModel {
  remoteId?: number;
  remoteHost?: number;
  remoteHostInfo?: any;
}

export interface OwnedModel {
  owner?: number;
  ownerUsername?: string;
  ownerDisplayName?: string;
  editors?: number[];
  editorsUsernames?: string[];
  viewers?: number[];
  viewersUsernames?: string[];
}

export interface UserBasic {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
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

export interface ProtocolQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  enabled?: boolean;
  owner?: number;
  includeVaulted?: boolean;
}