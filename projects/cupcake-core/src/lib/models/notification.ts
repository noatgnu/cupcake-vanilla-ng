export interface BaseNotification {
  type: string;
  message: string;
  timestamp: string;
  user_id?: number;
}

export interface TranscriptionStartedNotification extends BaseNotification {
  type: 'transcription.started';
  annotation_id: number;
}

export interface TranscriptionCompletedNotification extends BaseNotification {
  type: 'transcription.completed';
  annotation_id: number;
  language?: string;
  has_translation?: boolean;
}

export interface TranscriptionFailedNotification extends BaseNotification {
  type: 'transcription.failed';
  annotation_id: number;
  error: string;
}

export interface SystemNotification extends BaseNotification {
  type: 'system.notification';
  level: 'info' | 'warning' | 'error' | 'success';
  title: string;
}

export interface AsyncTaskUpdateNotification extends BaseNotification {
  type: 'async_task.update';
  task_id: string;
  status: string;
  progress_percentage?: number;
  progress_description?: string;
  error_message?: string;
  result?: any;
  download_url?: string;
}

export interface MetadataTableUpdateNotification extends BaseNotification {
  type: 'metadata_table.update';
  table_id: number;
  action: string;
  user?: number;
}

export interface LabGroupUpdateNotification extends BaseNotification {
  type: 'lab_group.update';
  lab_group_id: number;
  action: string;
}

export interface ConnectionEstablishedNotification {
  type: 'connection.established';
  message: string;
  user_id: number;
  username: string;
  lab_groups: number[];
}

export type WebSocketNotification =
  | TranscriptionStartedNotification
  | TranscriptionCompletedNotification
  | TranscriptionFailedNotification
  | SystemNotification
  | AsyncTaskUpdateNotification
  | MetadataTableUpdateNotification
  | LabGroupUpdateNotification
  | ConnectionEstablishedNotification;
