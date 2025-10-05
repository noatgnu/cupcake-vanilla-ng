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

  describe('Task Management', () => {
    it('should get all async tasks with parameters', (done) => {
      const params = { 
        status: 'pending',
        taskType: 'export',
        limit: 10,
        offset: 0
      };
      const mockResponse = {
        count: 5,
        results: [
          { 
            id: 'task-123', 
            taskType: 'export', 
            status: 'pending',
            progress: 0,
            createdAt: '2023-01-01T00:00:00Z'
          }
        ]
      };

      service.getAsyncTasks(params).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/async-tasks/` && 
        req.params.get('status') === 'pending' &&
        req.params.get('task_type') === 'export' &&
        req.params.get('limit') === '10' &&
        req.params.get('offset') === '0'
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        count: 5,
        results: [
          { 
            id: 'task-123', 
            task_type: 'export', 
            status: 'pending',
            progress: 0,
            created_at: '2023-01-01T00:00:00Z'
          }
        ]
      });
    });

    it('should get single async task', (done) => {
      const taskId = 'task-123';
      const mockResponse = {
        id: 'task-123',
        taskType: 'validation',
        status: 'running',
        progress: 45,
        result: null,
        error: null,
        startedAt: '2023-01-01T00:00:00Z'
      };

      service.getAsyncTask(taskId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/task-123/`);
      expect(req.request.method).toBe('GET');
      req.flush({
        id: 'task-123',
        task_type: 'validation',
        status: 'running',
        progress: 45,
        result: null,
        error: null,
        started_at: '2023-01-01T00:00:00Z'
      });
    });

    it('should cancel async task', (done) => {
      const taskId = 'task-123';
      const mockResponse = {
        id: 'task-123',
        status: 'cancelled',
        message: 'Task cancelled successfully'
      };

      service.cancelAsyncTask(taskId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/task-123/cancel/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should retry failed async task', (done) => {
      const taskId = 'task-123';
      const mockResponse = {
        id: 'task-123',
        status: 'pending',
        message: 'Task queued for retry',
        retryCount: 1
      };

      service.retryAsyncTask(taskId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/task-123/retry/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush({
        id: 'task-123',
        status: 'pending',
        message: 'Task queued for retry',
        retry_count: 1
      });
    });

    it('should delete completed task', (done) => {
      const taskId = 'task-123';

      service.deleteAsyncTask(taskId).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/task-123/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Task Result Management', () => {
    it('should get task result', (done) => {
      const taskId = 'task-123';
      const mockResponse = {
        taskId: 'task-123',
        result: {
          processedRecords: 1000,
          errors: [],
          warnings: ['Some warnings'],
          outputFile: '/files/result.csv'
        },
        completedAt: '2023-01-01T01:00:00Z'
      };

      service.getTaskResult(taskId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/task-123/result/`);
      expect(req.request.method).toBe('GET');
      req.flush({
        task_id: 'task-123',
        result: {
          processed_records: 1000,
          errors: [],
          warnings: ['Some warnings'],
          output_file: '/files/result.csv'
        },
        completed_at: '2023-01-01T01:00:00Z'
      });
    });

    it('should download task result file', (done) => {
      const taskId = 'task-123';
      const mockBlob = new Blob(['file content'], { type: 'text/csv' });

      service.downloadTaskResult(taskId).subscribe(response => {
        expect(response).toBe(mockBlob);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/task-123/download/`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('should get task logs', (done) => {
      const taskId = 'task-123';
      const mockResponse = {
        taskId: 'task-123',
        logs: [
          { timestamp: '2023-01-01T00:00:00Z', level: 'INFO', message: 'Task started' },
          { timestamp: '2023-01-01T00:30:00Z', level: 'INFO', message: 'Processing 50% complete' }
        ]
      };

      service.getTaskLogs(taskId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/task-123/logs/`);
      expect(req.request.method).toBe('GET');
      req.flush({
        task_id: 'task-123',
        logs: [
          { timestamp: '2023-01-01T00:00:00Z', level: 'INFO', message: 'Task started' },
          { timestamp: '2023-01-01T00:30:00Z', level: 'INFO', message: 'Processing 50% complete' }
        ]
      });
    });
  });

  describe('Task Statistics', () => {
    it('should get task statistics', (done) => {
      const mockResponse = {
        totalTasks: 150,
        pendingTasks: 5,
        runningTasks: 3,
        completedTasks: 140,
        failedTasks: 2,
        tasksByType: {
          export: 75,
          import: 40,
          validation: 35
        }
      };

      service.getTaskStatistics().subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/statistics/`);
      expect(req.request.method).toBe('GET');
      req.flush({
        total_tasks: 150,
        pending_tasks: 5,
        running_tasks: 3,
        completed_tasks: 140,
        failed_tasks: 2,
        tasks_by_type: {
          export: 75,
          import: 40,
          validation: 35
        }
      });
    });

    it('should get user task statistics', (done) => {
      const mockResponse = {
        userId: 1,
        totalTasks: 25,
        completedTasks: 20,
        failedTasks: 1,
        avgCompletionTime: 120.5
      };

      service.getUserTaskStatistics().subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/user-statistics/`);
      expect(req.request.method).toBe('GET');
      req.flush({
        user_id: 1,
        total_tasks: 25,
        completed_tasks: 20,
        failed_tasks: 1,
        avg_completion_time: 120.5
      });
    });
  });

  describe('Task Monitoring', () => {
    it('should poll task status until completion', (done) => {
      const taskId = 'task-123';
      let pollCount = 0;
      
      // Mock multiple status responses
      const statusResponses = [
        { id: 'task-123', status: 'running', progress: 25 },
        { id: 'task-123', status: 'running', progress: 50 },
        { id: 'task-123', status: 'running', progress: 75 },
        { id: 'task-123', status: 'completed', progress: 100 }
      ];

      service.pollTaskStatus(taskId, 100).subscribe(response => {
        if (response.status === 'completed') {
          expect(response.progress).toBe(100);
          done();
        }
      });

      // Handle multiple requests
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/task-123/`);
          req.flush(statusResponses[i]);
        }, i * 110);
      }
    });

    it('should stop polling when task fails', (done) => {
      const taskId = 'task-123';

      service.pollTaskStatus(taskId, 100).subscribe(
        response => {
          if (response.status === 'failed') {
            expect(response.error).toBe('Processing error');
            done();
          }
        }
      );

      const req1 = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/task-123/`);
      req1.flush({ id: 'task-123', status: 'running', progress: 10 });

      setTimeout(() => {
        const req2 = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/task-123/`);
        req2.flush({ id: 'task-123', status: 'failed', error: 'Processing error' });
      }, 110);
    });
  });

  describe('Queue Management', () => {
    it('should get task queue status', (done) => {
      const mockResponse = {
        queueLength: 15,
        processingCapacity: 5,
        averageWaitTime: 180,
        estimatedProcessingTime: 300
      };

      service.getTaskQueueStatus().subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/queue-status/`);
      expect(req.request.method).toBe('GET');
      req.flush({
        queue_length: 15,
        processing_capacity: 5,
        average_wait_time: 180,
        estimated_processing_time: 300
      });
    });

    it('should pause task queue', (done) => {
      const mockResponse = {
        status: 'paused',
        message: 'Task queue paused'
      };

      service.pauseTaskQueue().subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/queue-control/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ action: 'pause' });
      req.flush(mockResponse);
    });

    it('should resume task queue', (done) => {
      const mockResponse = {
        status: 'running',
        message: 'Task queue resumed'
      };

      service.resumeTaskQueue().subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/queue-control/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ action: 'resume' });
      req.flush(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle task not found error', (done) => {
      service.getAsyncTask('non-existent').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(404);
          expect(error.error.detail).toBe('Task not found');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/non-existent/`);
      req.flush({ detail: 'Task not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle permission denied for task cancellation', (done) => {
      service.cancelAsyncTask('protected-task').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(403);
          expect(error.error.detail).toBe('Permission denied');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/protected-task/cancel/`);
      req.flush({ detail: 'Permission denied' }, { status: 403, statusText: 'Forbidden' });
    });

    it('should handle server errors during task operations', (done) => {
      service.getAsyncTasks().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/`);
      req.flush({ error: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle timeout during file download', (done) => {
      service.downloadTaskResult('slow-task').subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(408);
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/slow-task/download/`);
      req.flush({ error: 'Request timeout' }, { status: 408, statusText: 'Request Timeout' });
    });
  });

  describe('Data Transformation', () => {
    it('should transform snake_case response to camelCase', (done) => {
      const mockResponse = {
        id: 'task-123',
        task_type: 'export',
        created_at: '2023-01-01T00:00:00Z',
        started_at: '2023-01-01T00:01:00Z',
        completed_at: '2023-01-01T00:30:00Z',
        retry_count: 0,
        max_retries: 3,
        processing_time: 1800
      };

      const expectedResponse = {
        id: 'task-123',
        taskType: 'export',
        createdAt: '2023-01-01T00:00:00Z',
        startedAt: '2023-01-01T00:01:00Z',
        completedAt: '2023-01-01T00:30:00Z',
        retryCount: 0,
        maxRetries: 3,
        processingTime: 1800
      };

      service.getAsyncTask('task-123').subscribe(response => {
        expect(response).toEqual(expectedResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/task-123/`);
      req.flush(mockResponse);
    });

    it('should transform camelCase parameters to snake_case', (done) => {
      const params = {
        taskType: 'validation',
        createdAfter: '2023-01-01',
        maxRetries: 3,
        includeCompleted: false
      };

      service.getAsyncTasks(params).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(req => 
        req.params.get('task_type') === 'validation' &&
        req.params.get('created_after') === '2023-01-01' &&
        req.params.get('max_retries') === '3' &&
        req.params.get('include_completed') === 'false'
      );
      req.flush({ count: 0, results: [] });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete task lifecycle', (done) => {
      const taskId = 'lifecycle-task';
      let currentStep = 0;

      const steps = [
        () => {
          // 1. Get initial task status
          service.getAsyncTask(taskId).subscribe(task => {
            expect(task.status).toBe('pending');
            currentStep++;
            steps[currentStep]();
          });

          const req1 = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/${taskId}/`);
          req1.flush({ id: taskId, status: 'pending', progress: 0 });
        },
        () => {
          // 2. Monitor task progress
          service.getAsyncTask(taskId).subscribe(task => {
            expect(task.status).toBe('running');
            expect(task.progress).toBe(50);
            currentStep++;
            steps[currentStep]();
          });

          const req2 = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/${taskId}/`);
          req2.flush({ id: taskId, status: 'running', progress: 50 });
        },
        () => {
          // 3. Check completion and get result
          service.getAsyncTask(taskId).subscribe(task => {
            expect(task.status).toBe('completed');

            service.getTaskResult(taskId).subscribe(result => {
              expect(result.result.processedRecords).toBeGreaterThan(0);
              done();
            });

            const resultReq = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/${taskId}/result/`);
            resultReq.flush({
              task_id: taskId,
              result: { processed_records: 1000 }
            });
          });

          const req3 = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/${taskId}/`);
          req3.flush({ id: taskId, status: 'completed', progress: 100 });
        }
      ];

      steps[0]();
    });

    it('should handle task failure and retry scenario', (done) => {
      const taskId = 'retry-task';

      // 1. Task fails first time
      service.getAsyncTask(taskId).subscribe(task => {
        expect(task.status).toBe('failed');

        // 2. Retry the task
        service.retryAsyncTask(taskId).subscribe(retryResponse => {
          expect(retryResponse.status).toBe('pending');
          expect(retryResponse.retryCount).toBe(1);
          done();
        });

        const retryReq = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/${taskId}/retry/`);
        retryReq.flush({
          id: taskId,
          status: 'pending',
          retry_count: 1
        });
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/async-tasks/${taskId}/`);
      req.flush({ id: taskId, status: 'failed', error: 'Processing failed' });
    });
  });
});