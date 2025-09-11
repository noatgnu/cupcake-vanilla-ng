export enum StorageObjectType {
  SHELF = 'shelf',
  BOX = 'box',
  FRIDGE = 'fridge',
  FREEZER = 'freezer',
  ROOM = 'room',
  BUILDING = 'building',
  FLOOR = 'floor',
  OTHER = 'other'
}

export const StorageObjectTypeLabels: Record<StorageObjectType, string> = {
  [StorageObjectType.SHELF]: 'Shelf',
  [StorageObjectType.BOX]: 'Box',
  [StorageObjectType.FRIDGE]: 'Fridge',
  [StorageObjectType.FREEZER]: 'Freezer',
  [StorageObjectType.ROOM]: 'Room',
  [StorageObjectType.BUILDING]: 'Building',
  [StorageObjectType.FLOOR]: 'Floor',
  [StorageObjectType.OTHER]: 'Other'
};

export enum MaintenanceType {
  ROUTINE = 'routine',
  EMERGENCY = 'emergency',
  OTHER = 'other'
}

export const MaintenanceTypeLabels: Record<MaintenanceType, string> = {
  [MaintenanceType.ROUTINE]: 'Routine',
  [MaintenanceType.EMERGENCY]: 'Emergency',
  [MaintenanceType.OTHER]: 'Other'
};

export enum Status {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REQUESTED = 'requested',
  CANCELLED = 'cancelled'
}

export const StatusLabels: Record<Status, string> = {
  [Status.DRAFT]: 'Draft',
  [Status.SUBMITTED]: 'Submitted',
  [Status.PENDING]: 'Pending',
  [Status.IN_PROGRESS]: 'In Progress',
  [Status.COMPLETED]: 'Completed',
  [Status.REQUESTED]: 'Requested',
  [Status.CANCELLED]: 'Cancelled'
};

export enum JobType {
  MAINTENANCE = 'maintenance',
  ANALYSIS = 'analysis',
  OTHER = 'other'
}

export const JobTypeLabels: Record<JobType, string> = {
  [JobType.MAINTENANCE]: 'Maintenance',
  [JobType.ANALYSIS]: 'Analysis',
  [JobType.OTHER]: 'Other'
};

export enum SampleType {
  WCL = 'wcl',
  IP = 'ip',
  OTHER = 'other'
}

export const SampleTypeLabels: Record<SampleType, string> = {
  [SampleType.WCL]: 'Whole Cell Lysate',
  [SampleType.IP]: 'Immunoprecipitate',
  [SampleType.OTHER]: 'Other'
};


export enum ReagentActionType {
  ADD = 'add',
  REMOVE = 'remove',
  UPDATE = 'update'
}

export const ReagentActionTypeLabels: Record<ReagentActionType, string> = {
  [ReagentActionType.ADD]: 'Add',
  [ReagentActionType.REMOVE]: 'Remove',
  [ReagentActionType.UPDATE]: 'Update'
};