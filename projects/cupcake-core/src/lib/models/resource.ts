/**
 * Base resource interface that mirrors the Django AbstractResource model.
 * Provides standardized ownership, permissions, and audit fields.
 */
export interface BaseResource {
  id?: number;
  resource_type?: string;
  
  // Ownership and access
  owner?: number;
  owner_username?: string;
  lab_group?: number | { id: number; name: string; [key: string]: any };
  lab_group_name?: string;
  
  // Visibility and access control
  visibility?: ResourceVisibility;
  
  // Resource status
  is_active?: boolean;
  is_locked?: boolean;
  
  // Audit trail
  created_at?: string;
  updated_at?: string;
  
  // Permission checking
  can_view?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  can_share?: boolean;
  user_role?: ResourceRole;
}

export enum ResourceVisibility {
  PRIVATE = 'private',
  GROUP = 'group', 
  PUBLIC = 'public'
}

export enum ResourceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

export enum ResourceType {
  METADATA_TABLE = 'metadata_table',
  METADATA_TABLE_TEMPLATE = 'metadata_table_template',
  METADATA_COLUMN_TEMPLATE = 'metadata_column_template',
  FILE = 'file',
  DATASET = 'dataset',
  SCHEMA = 'schema'
}

/**
 * Resource permission for explicit access control
 */
export interface ResourcePermission {
  id?: number;
  user: number;
  user_username?: string;
  role: ResourceRole;
  granted_by?: number;
  granted_by_username?: string;
  granted_at?: string;
}