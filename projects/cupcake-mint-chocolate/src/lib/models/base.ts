export interface BaseTimestampedModel {
  createdAt: string;
  updatedAt: string;
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

export interface NotificationQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  ordering?: string;
  notificationType?: string;
  priority?: string;
  isRead?: boolean;
  recipient?: number;
  includeExpired?: boolean;
  sender?: number;
  deliveryStatus?: string;
  limit?: number;
  offset?: number;
}