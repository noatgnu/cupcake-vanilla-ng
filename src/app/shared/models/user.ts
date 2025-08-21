export interface User {
  id?: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff?: boolean;
  is_active?: boolean;
  date_joined?: string;
  last_login?: string;
}

export interface UserCreateRequest {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  is_staff?: boolean;
  is_active?: boolean;
}

export interface UserRegistrationRequest {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface UserResponse {
  message: string;
  user: User;
}

export interface UserListResponse {
  count: number;
  next?: string;
  previous?: string;
  results: User[];
}