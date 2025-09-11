export interface BaseTimestampedModel {
  createdAt: string;
  updatedAt: string;
}

export interface UserBasic {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}