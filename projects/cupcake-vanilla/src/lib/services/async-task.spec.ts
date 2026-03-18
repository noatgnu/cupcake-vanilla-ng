import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AsyncTaskService } from './async-task';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

describe('AsyncTaskService', () => {
  let service: AsyncTaskService;
  let httpMock: HttpTestingController;
  const mockConfig = {
    apiUrl: 'https://api.test.com',
    siteName: 'Test Site'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AsyncTaskService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig }
      ]
    });
    service = TestBed.inject(AsyncTaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
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

      service.getAsyncTasks().subscribe(response => {
        expect(response.count).toBe(2);
        expect(response.results.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get tasks with query parameters', (done) => {
      const params = {
        taskType: 'export',
        status: 'completed',
        limit: 10
      };

      service.getAsyncTasks(params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url === `${mockConfig.apiUrl}/async-tasks/` &&
        req.params.get('task_type') === 'export' &&
        req.params.get('status') === 'completed' &&
        req.params.get('limit') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ count: 0, results: [] });
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

      service.getAsyncTask(taskId).subscribe(response => {
        expect(response.id).toBe(taskId);
        expect(response.status).toBe('completed');
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/${taskId}/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('cancelTask', () => {
    it('should cancel a task', (done) => {
      const taskId = 'task-123';

      service.cancelTask(taskId).subscribe(response => {
        expect(response.message).toBe('Task cancelled');
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/${taskId}/cancel/`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Task cancelled' });
    });
  });

  describe('getDownloadUrl', () => {
    it('should get download URL for task result', (done) => {
      const taskId = 'task-123';
      const mockResponse = {
        url: 'https://storage.example.com/file.xlsx?token=abc123',
        expiresAt: '2023-01-01T01:00:00Z'
      };

      service.getDownloadUrl(taskId).subscribe(response => {
        expect(response.url).toContain('storage.example.com');
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/${taskId}/download_url/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('downloadTaskFile', () => {
    it('should download task file as blob', (done) => {
      const taskId = 'task-123';
      const token = 'abc123';
      const mockBlob = new Blob(['file content'], { type: 'application/octet-stream' });

      service.downloadTaskFile(taskId, token).subscribe(response => {
        expect(response instanceof Blob).toBe(true);
        done();
      });

      const req = httpMock.expectOne(req =>
        req.url === `${mockConfig.apiUrl}/async-tasks/${taskId}/download/` &&
        req.params.get('token') === token
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent task', (done) => {
      service.getAsyncTask('non-existent').subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/non-existent/`);
      req.flush({ detail: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle server errors', (done) => {
      service.getAsyncTasks().subscribe({
        next: () => fail('should have failed'),
        error: error => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/`);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
