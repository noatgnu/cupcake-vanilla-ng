import { TaskType, TASK_TYPE_LABELS } from './async-task';

describe('TaskType', () => {
  it('should match the backend task type for protocols.io exports', () => {
    expect(TaskType.EXPORT_PROTOCOLS_IO).toBe('EXPORT_PROTOCOLS_IO');
  });

  it('should label every task type', () => {
    for (const taskType of Object.values(TaskType)) {
      expect(TASK_TYPE_LABELS[taskType]).toBeTruthy();
    }
    expect(TASK_TYPE_LABELS[TaskType.EXPORT_PROTOCOLS_IO]).toBe('Export to protocols.io');
  });
});
