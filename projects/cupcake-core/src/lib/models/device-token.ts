export interface DeviceToken {
  id: number;
  token: string;
  label: string;
  description: string;
  permission: 'read' | 'write';
  enabled: boolean;
  user: number;
  username: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isExpired: boolean;
}

export interface DeviceTokenCreate {
  label: string;
  description: string;
  permission: 'read' | 'write';
  enabled: boolean;
  expiresAt: string | null;
}

export interface DeviceSummary {
  instruments: number;
  activeJobs: number;
  lowReagents: number;
  users: number;
  labGroups: number;
  activeTimers: number;
}
