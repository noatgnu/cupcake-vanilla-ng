export interface WorkerCurrentJob {
  id: string;
  funcName: string;
  createdAt: string | null;
  startedAt: string | null;
  description: string;
}

export interface Worker {
  name: string;
  hostname: string;
  pid: number;
  state: 'idle' | 'busy' | 'suspended' | 'dead';
  queues: string[];
  birth: string | null;
  successfulJobCount: number;
  failedJobCount: number;
  totalWorkingTime: number;
  currentJob: WorkerCurrentJob | null;
}

export interface QueueStats {
  count: number;
  failedCount: number;
  scheduledCount: number;
  startedCount: number;
  finishedCount: number;
}

export interface WorkerStatusResponse {
  workers: Worker[];
  workerCount: number;
  queues: {
    [queueName: string]: QueueStats;
  };
}
