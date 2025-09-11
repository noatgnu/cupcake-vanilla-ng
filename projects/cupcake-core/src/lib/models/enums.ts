export enum ResourceType {
  METADATA_TABLE = 'metadata_table',
  METADATA_TABLE_TEMPLATE = 'metadata_table_template', 
  METADATA_COLUMN_TEMPLATE = 'metadata_column_template',
  FILE = 'file',
  DATASET = 'dataset',
  SCHEMA = 'schema'
}
export const ResourceTypeLabels: Record<ResourceType, string> = {
  [ResourceType.METADATA_TABLE]: 'Metadata Table',
  [ResourceType.METADATA_TABLE_TEMPLATE]: 'Metadata Table Template',
  [ResourceType.METADATA_COLUMN_TEMPLATE]: 'Metadata Column Template',
  [ResourceType.FILE]: 'File',
  [ResourceType.DATASET]: 'Dataset',
  [ResourceType.SCHEMA]: 'Schema'
};

export enum ResourceVisibility {
  PRIVATE = 'private',
  GROUP = 'group',
  PUBLIC = 'public'
}

export const ResourceVisibilityLabels: Record<ResourceVisibility, string> = {
  [ResourceVisibility.PRIVATE]: 'Private',
  [ResourceVisibility.GROUP]: 'Lab Group',
  [ResourceVisibility.PUBLIC]: 'Public'
};

export enum ResourceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

export const ResourceRoleLabels: Record<ResourceRole, string> = {
  [ResourceRole.OWNER]: 'Owner',
  [ResourceRole.ADMIN]: 'Administrator', 
  [ResourceRole.EDITOR]: 'Editor',
  [ResourceRole.VIEWER]: 'Viewer'
};

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export const InvitationStatusLabels: Record<InvitationStatus, string> = {
  [InvitationStatus.PENDING]: 'Pending',
  [InvitationStatus.ACCEPTED]: 'Accepted',
  [InvitationStatus.REJECTED]: 'Rejected',
  [InvitationStatus.EXPIRED]: 'Expired',
  [InvitationStatus.CANCELLED]: 'Cancelled'
};