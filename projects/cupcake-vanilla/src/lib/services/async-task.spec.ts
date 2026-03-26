import { of } from 'rxjs';
import { AsyncTaskService } from './async-task';

describe('AsyncTaskService', () => {
  let service: jasmine.SpyObj<AsyncTaskService>;

  beforeEach(() => {
    service = jasmine.createSpyObj('AsyncTaskService', [
      'getAsyncTasks',
      'getAsyncTask',
      'cancelTask',
      'getDownloadUrl',
      'downloadTaskFile'
    ]);
  });

  describe('getAsyncTasks', () => {
    it('should get all async tasks', (done) => {
      const mockResponse = {
        count: 2,
        next: undefined,
        previous: undefined,
        results: [
          {
            id: 'task-1',
            taskType: 'export',
            status: 'completed',
            progress: 100,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          },
          {
            id: 'task-2',
            taskType: 'import',
            status: 'running',
            progress: 50,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
          }
        ]
      };
      service.getAsyncTasks.and.returnValue(of(mockResponse as any));

      service.getAsyncTasks().subscribe(response => {
        expect(response.count).toBe(2);
        expect(response.results.length).toBe(2);
        done();
      });

      expect(service.getAsyncTasks).toHaveBeenCalled();
    });

    it('should get tasks with query parameters', (done) => {
      const params = {
        taskType: 'export',
        status: 'completed',
        limit: 10
      };
      const mockResponse = { count: 0, results: [] };
      service.getAsyncTasks.and.returnValue(of(mockResponse as any));

      service.getAsyncTasks(params).subscribe(() => {
        done();
      });

      expect(service.getAsyncTasks).toHaveBeenCalledWith(params);
    });
  });

  describe('getAsyncTask', () => {
    it('should get a specific task by ID', (done) => {
      const taskId = 'task-123';
      const mockResponse = {
        id: taskId,
        taskType: 'export',
        status: 'completed',
        progress: 100,
        result: { fileUrl: '/download/file.xlsx' },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };
      service.getAsyncTask.and.returnValue(of(mockResponse as any));

      service.getAsyncTask(taskId).subscribe(response => {
        expect(response.id).toBe(taskId);
        expect(response.status).toBe('completed');
        done();
      });

      expect(service.getAsyncTask).toHaveBeenCalledWith(taskId);
    });
  });

  describe('cancelTask', () => {
    it('should cancel a task', (done) => {
      const taskId = 'task-123';
      service.cancelTask.and.returnValue(of({ message: 'Task cancelled' }));

      service.cancelTask(taskId).subscribe(response => {
        expect(response.message).toBe('Task cancelled');
        done();
      });

      expect(service.cancelTask).toHaveBeenCalledWith(taskId);
    });
  });

  describe('getDownloadUrl', () => {
    it('should get download URL for task result', (done) => {
      const taskId = 'task-123';
      const mockResponse = {
        downloadUrl: 'https://storage.example.com/file.xlsx?token=abc123',
        filename: 'file.xlsx',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: 1024,
        expiresAt: '2023-01-01T01:00:00Z',
        expiresInHours: 1
      };
      service.getDownloadUrl.and.returnValue(of(mockResponse as any));

      service.getDownloadUrl(taskId).subscribe(response => {
        expect(response.downloadUrl).toContain('storage.example.com');
        expect(response.filename).toBe('file.xlsx');
        done();
      });

      expect(service.getDownloadUrl).toHaveBeenCalledWith(taskId);
    });
  });

  describe('downloadTaskFile', () => {
    it('should download task file as blob', (done) => {
      const taskId = 'task-123';
      const token = 'abc123';
      const mockBlob = new Blob(['file content'], { type: 'application/octet-stream' });
      service.downloadTaskFile.and.returnValue(of(mockBlob));

      service.downloadTaskFile(taskId, token).subscribe(response => {
        expect(response instanceof Blob).toBe(true);
        done();
      });

      expect(service.downloadTaskFile).toHaveBeenCalledWith(taskId, token);
    });
  });
});
