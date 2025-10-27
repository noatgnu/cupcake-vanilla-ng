import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { BaseApiService } from '@noatgnu/cupcake-core';
import jsSHA from 'jssha';

import {
  AnnotationChunkedUploadResponse,
  AnnotationChunkedUploadCompletionResponse,
  StepAnnotationChunkedUploadRequest,
  StepAnnotationChunkedUploadCompletionRequest,
  SessionAnnotationChunkedUploadRequest,
  SessionAnnotationChunkedUploadCompletionRequest,
  SessionAnnotationFolderChunkedUploadRequest,
  SessionAnnotationFolderChunkedUploadCompletionRequest
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AnnotationChunkedUploadService extends BaseApiService {

  uploadStepAnnotationChunk(
    request: StepAnnotationChunkedUploadRequest,
    uploadId?: string,
    offset?: number,
    totalSize?: number
  ): Observable<AnnotationChunkedUploadResponse> {
    const formData = new FormData();
    formData.append('file', request.file);

    if (request.filename) {
      formData.append('filename', request.filename);
    }
    formData.append('session_id', request.sessionId.toString());
    formData.append('step_id', request.stepId.toString());
    if (request.folderId) {
      formData.append('folder_id', request.folderId.toString());
    }
    if (request.annotation) {
      formData.append('annotation', request.annotation);
    }
    if (request.annotationType) {
      formData.append('annotation_type', request.annotationType);
    }

    const url = uploadId
      ? `${this.apiUrl}/upload/step-annotation-chunks/${uploadId}/`
      : `${this.apiUrl}/upload/step-annotation-chunks/`;

    const httpOptions: any = {};
    const isChunkedUpload = offset !== undefined && totalSize !== undefined;

    if (isChunkedUpload) {
      const chunkEnd = offset + request.file.size - 1;
      httpOptions.headers = {
        'Content-Range': `bytes ${offset}-${chunkEnd}/${totalSize}`
      };
    }

    if (isChunkedUpload || uploadId) {
      return this.put<AnnotationChunkedUploadResponse>(url, formData, httpOptions);
    } else {
      return this.post<AnnotationChunkedUploadResponse>(url, formData, httpOptions);
    }
  }

  completeStepAnnotationUpload(
    uploadId: string,
    request: StepAnnotationChunkedUploadCompletionRequest
  ): Observable<AnnotationChunkedUploadCompletionResponse> {
    const formData = new FormData();
    formData.append('sha256', request.sha256);
    formData.append('session_id', request.sessionId.toString());
    formData.append('step_id', request.stepId.toString());
    if (request.folderId) {
      formData.append('folder_id', request.folderId.toString());
    }
    if (request.annotation) {
      formData.append('annotation', request.annotation);
    }
    if (request.annotationType) {
      formData.append('annotation_type', request.annotationType);
    }

    return this.post<AnnotationChunkedUploadCompletionResponse>(
      `${this.apiUrl}/upload/step-annotation-chunks/${uploadId}/`,
      formData
    );
  }

  uploadStepAnnotationFileInChunks(
    file: File,
    sessionId: number,
    stepId: number,
    chunkSize: number = 1024 * 1024,
    options?: {
      folderId?: number;
      annotation?: string;
      annotationType?: string;
      onProgress?: (progress: number) => void;
    }
  ): Observable<AnnotationChunkedUploadCompletionResponse> {
    return new Observable(subscriber => {
      let uploadId: string | undefined;
      let offset = 0;
      const totalSize = file.size;
      const sha256 = new jsSHA('SHA-256', 'ARRAYBUFFER');

      if (totalSize <= chunkSize) {
        this.completeStepAnnotationUploadWithFile({
          file: file,
          filename: file.name,
          sessionId: sessionId,
          stepId: stepId,
          folderId: options?.folderId,
          annotation: options?.annotation,
          annotationType: options?.annotationType
        }).subscribe({
          next: (result) => {
            subscriber.next(result);
            subscriber.complete();
          },
          error: (error) => subscriber.error(error)
        });
        return;
      }

      const uploadNextChunk = () => {
        if (offset >= totalSize) {
          if (uploadId) {
            const calculatedHash = sha256.getHash('HEX');
            this.completeStepAnnotationUpload(uploadId, {
              sha256: calculatedHash,
              sessionId: sessionId,
              stepId: stepId,
              folderId: options?.folderId,
              annotation: options?.annotation,
              annotationType: options?.annotationType
            }).subscribe({
              next: (result) => {
                subscriber.next(result);
                subscriber.complete();
              },
              error: (error) => subscriber.error(error)
            });
          } else {
            subscriber.error(new Error('Upload failed: No upload ID'));
          }
          return;
        }

        const end = Math.min(offset + chunkSize, totalSize);
        const chunk = file.slice(offset, end);
        const chunkFile = new File([chunk], file.name, { type: file.type });

        chunk.arrayBuffer().then(arrayBuffer => {
          sha256.update(arrayBuffer);

          this.uploadStepAnnotationChunk({
            file: chunkFile,
            filename: file.name,
            sessionId: sessionId,
            stepId: stepId,
            folderId: options?.folderId,
            annotation: options?.annotation,
            annotationType: options?.annotationType
          }, uploadId, offset, totalSize).subscribe({
            next: (response) => {
              uploadId = response.id;
              offset = response.offset;

              const progress = (offset / totalSize) * 100;
              if (options?.onProgress) {
                options.onProgress(progress);
              }

              uploadNextChunk();
            },
            error: (error) => subscriber.error(error)
          });
        }).catch(error => subscriber.error(error));
      };

      uploadNextChunk();
    });
  }

  completeStepAnnotationUploadWithFile(
    request: StepAnnotationChunkedUploadRequest
  ): Observable<AnnotationChunkedUploadCompletionResponse> {
    const hasher = new jsSHA('SHA-256', 'ARRAYBUFFER');
    const arrayBufferPromise = request.file.arrayBuffer();

    return from(arrayBufferPromise).pipe(
      switchMap((arrayBuffer) => {
        hasher.update(arrayBuffer);
        const hash = hasher.getHash('HEX');

        const formData = new FormData();
        formData.append('file', request.file);
        if (request.filename) {
          formData.append('filename', request.filename);
        }
        formData.append('session_id', request.sessionId.toString());
        formData.append('step_id', request.stepId.toString());
        if (request.folderId) {
          formData.append('folder_id', request.folderId.toString());
        }
        if (request.annotation) {
          formData.append('annotation', request.annotation);
        }
        if (request.annotationType) {
          formData.append('annotation_type', request.annotationType);
        }
        formData.append('sha256', hash);

        return this.post<AnnotationChunkedUploadCompletionResponse>(
          `${this.apiUrl}/upload/step-annotation-chunks/`,
          formData
        );
      })
    );
  }

  uploadSessionAnnotationChunk(
    request: SessionAnnotationChunkedUploadRequest,
    uploadId?: string,
    offset?: number,
    totalSize?: number
  ): Observable<AnnotationChunkedUploadResponse> {
    const formData = new FormData();
    formData.append('file', request.file);

    if (request.filename) {
      formData.append('filename', request.filename);
    }
    formData.append('session_id', request.sessionId.toString());
    if (request.folderId) {
      formData.append('folder_id', request.folderId.toString());
    }
    if (request.annotation) {
      formData.append('annotation', request.annotation);
    }
    if (request.annotationType) {
      formData.append('annotation_type', request.annotationType);
    }

    const url = uploadId
      ? `${this.apiUrl}/upload/session-annotation-chunks/${uploadId}/`
      : `${this.apiUrl}/upload/session-annotation-chunks/`;

    const httpOptions: any = {};
    const isChunkedUpload = offset !== undefined && totalSize !== undefined;

    if (isChunkedUpload) {
      const chunkEnd = offset + request.file.size - 1;
      httpOptions.headers = {
        'Content-Range': `bytes ${offset}-${chunkEnd}/${totalSize}`
      };
    }

    if (isChunkedUpload || uploadId) {
      return this.put<AnnotationChunkedUploadResponse>(url, formData, httpOptions);
    } else {
      return this.post<AnnotationChunkedUploadResponse>(url, formData, httpOptions);
    }
  }

  completeSessionAnnotationUpload(
    uploadId: string,
    request: SessionAnnotationChunkedUploadCompletionRequest
  ): Observable<AnnotationChunkedUploadCompletionResponse> {
    const formData = new FormData();
    formData.append('sha256', request.sha256);
    formData.append('session_id', request.sessionId.toString());
    if (request.folderId) {
      formData.append('folder_id', request.folderId.toString());
    }
    if (request.annotation) {
      formData.append('annotation', request.annotation);
    }
    if (request.annotationType) {
      formData.append('annotation_type', request.annotationType);
    }

    return this.post<AnnotationChunkedUploadCompletionResponse>(
      `${this.apiUrl}/upload/session-annotation-chunks/${uploadId}/`,
      formData
    );
  }

  uploadSessionAnnotationFileInChunks(
    file: File,
    sessionId: number,
    chunkSize: number = 1024 * 1024,
    options?: {
      folderId?: number;
      annotation?: string;
      annotationType?: string;
      onProgress?: (progress: number) => void;
    }
  ): Observable<AnnotationChunkedUploadCompletionResponse> {
    return new Observable(subscriber => {
      let uploadId: string | undefined;
      let offset = 0;
      const totalSize = file.size;
      const sha256 = new jsSHA('SHA-256', 'ARRAYBUFFER');

      if (totalSize <= chunkSize) {
        this.completeSessionAnnotationUploadWithFile({
          file: file,
          filename: file.name,
          sessionId: sessionId,
          folderId: options?.folderId,
          annotation: options?.annotation,
          annotationType: options?.annotationType
        }).subscribe({
          next: (result) => {
            subscriber.next(result);
            subscriber.complete();
          },
          error: (error) => subscriber.error(error)
        });
        return;
      }

      const uploadNextChunk = () => {
        if (offset >= totalSize) {
          if (uploadId) {
            const calculatedHash = sha256.getHash('HEX');
            this.completeSessionAnnotationUpload(uploadId, {
              sha256: calculatedHash,
              sessionId: sessionId,
              folderId: options?.folderId,
              annotation: options?.annotation,
              annotationType: options?.annotationType
            }).subscribe({
              next: (result) => {
                subscriber.next(result);
                subscriber.complete();
              },
              error: (error) => subscriber.error(error)
            });
          } else {
            subscriber.error(new Error('Upload failed: No upload ID'));
          }
          return;
        }

        const end = Math.min(offset + chunkSize, totalSize);
        const chunk = file.slice(offset, end);
        const chunkFile = new File([chunk], file.name, { type: file.type });

        chunk.arrayBuffer().then(arrayBuffer => {
          sha256.update(arrayBuffer);

          this.uploadSessionAnnotationChunk({
            file: chunkFile,
            filename: file.name,
            sessionId: sessionId,
            folderId: options?.folderId,
            annotation: options?.annotation,
            annotationType: options?.annotationType
          }, uploadId, offset, totalSize).subscribe({
            next: (response) => {
              uploadId = response.id;
              offset = response.offset;

              const progress = (offset / totalSize) * 100;
              if (options?.onProgress) {
                options.onProgress(progress);
              }

              uploadNextChunk();
            },
            error: (error) => subscriber.error(error)
          });
        }).catch(error => subscriber.error(error));
      };

      uploadNextChunk();
    });
  }

  completeSessionAnnotationUploadWithFile(
    request: SessionAnnotationChunkedUploadRequest
  ): Observable<AnnotationChunkedUploadCompletionResponse> {
    const hasher = new jsSHA('SHA-256', 'ARRAYBUFFER');
    const arrayBufferPromise = request.file.arrayBuffer();

    return from(arrayBufferPromise).pipe(
      switchMap((arrayBuffer) => {
        hasher.update(arrayBuffer);
        const hash = hasher.getHash('HEX');

        const formData = new FormData();
        formData.append('file', request.file);
        if (request.filename) {
          formData.append('filename', request.filename);
        }
        formData.append('session_id', request.sessionId.toString());
        if (request.folderId) {
          formData.append('folder_id', request.folderId.toString());
        }
        if (request.annotation) {
          formData.append('annotation', request.annotation);
        }
        if (request.annotationType) {
          formData.append('annotation_type', request.annotationType);
        }
        formData.append('sha256', hash);

        return this.post<AnnotationChunkedUploadCompletionResponse>(
          `${this.apiUrl}/upload/session-annotation-chunks/`,
          formData
        );
      })
    );
  }

  uploadSessionAnnotationFolderChunk(
    request: SessionAnnotationFolderChunkedUploadRequest,
    uploadId?: string,
    offset?: number,
    totalSize?: number
  ): Observable<AnnotationChunkedUploadResponse> {
    const formData = new FormData();
    formData.append('file', request.file);

    if (request.filename) {
      formData.append('filename', request.filename);
    }
    formData.append('session_id', request.sessionId.toString());
    formData.append('folder_id', request.folderId.toString());
    if (request.annotation) {
      formData.append('annotation', request.annotation);
    }
    if (request.annotationType) {
      formData.append('annotation_type', request.annotationType);
    }

    const url = uploadId
      ? `${this.apiUrl}/upload/session-annotation-folder-chunks/${uploadId}/`
      : `${this.apiUrl}/upload/session-annotation-folder-chunks/`;

    const httpOptions: any = {};
    const isChunkedUpload = offset !== undefined && totalSize !== undefined;

    if (isChunkedUpload) {
      const chunkEnd = offset + request.file.size - 1;
      httpOptions.headers = {
        'Content-Range': `bytes ${offset}-${chunkEnd}/${totalSize}`
      };
    }

    if (isChunkedUpload || uploadId) {
      return this.put<AnnotationChunkedUploadResponse>(url, formData, httpOptions);
    } else {
      return this.post<AnnotationChunkedUploadResponse>(url, formData, httpOptions);
    }
  }

  completeSessionAnnotationFolderUpload(
    uploadId: string,
    request: SessionAnnotationFolderChunkedUploadCompletionRequest
  ): Observable<AnnotationChunkedUploadCompletionResponse> {
    const formData = new FormData();
    formData.append('sha256', request.sha256);
    formData.append('session_id', request.sessionId.toString());
    formData.append('folder_id', request.folderId.toString());
    if (request.annotation) {
      formData.append('annotation', request.annotation);
    }
    if (request.annotationType) {
      formData.append('annotation_type', request.annotationType);
    }

    return this.post<AnnotationChunkedUploadCompletionResponse>(
      `${this.apiUrl}/upload/session-annotation-folder-chunks/${uploadId}/`,
      formData
    );
  }

  uploadSessionAnnotationFolderFileInChunks(
    file: File,
    sessionId: number,
    folderId: number,
    chunkSize: number = 1024 * 1024,
    options?: {
      annotation?: string;
      annotationType?: string;
      onProgress?: (progress: number) => void;
    }
  ): Observable<AnnotationChunkedUploadCompletionResponse> {
    return new Observable(subscriber => {
      let uploadId: string | undefined;
      let offset = 0;
      const totalSize = file.size;
      const sha256 = new jsSHA('SHA-256', 'ARRAYBUFFER');

      if (totalSize <= chunkSize) {
        this.completeSessionAnnotationFolderUploadWithFile({
          file: file,
          filename: file.name,
          sessionId: sessionId,
          folderId: folderId,
          annotation: options?.annotation,
          annotationType: options?.annotationType
        }).subscribe({
          next: (result) => {
            subscriber.next(result);
            subscriber.complete();
          },
          error: (error) => subscriber.error(error)
        });
        return;
      }

      const uploadNextChunk = () => {
        if (offset >= totalSize) {
          if (uploadId) {
            const calculatedHash = sha256.getHash('HEX');
            this.completeSessionAnnotationFolderUpload(uploadId, {
              sha256: calculatedHash,
              sessionId: sessionId,
              folderId: folderId,
              annotation: options?.annotation,
              annotationType: options?.annotationType
            }).subscribe({
              next: (result) => {
                subscriber.next(result);
                subscriber.complete();
              },
              error: (error) => subscriber.error(error)
            });
          } else {
            subscriber.error(new Error('Upload failed: No upload ID'));
          }
          return;
        }

        const end = Math.min(offset + chunkSize, totalSize);
        const chunk = file.slice(offset, end);
        const chunkFile = new File([chunk], file.name, { type: file.type });

        chunk.arrayBuffer().then(arrayBuffer => {
          sha256.update(arrayBuffer);

          this.uploadSessionAnnotationFolderChunk({
            file: chunkFile,
            filename: file.name,
            sessionId: sessionId,
            folderId: folderId,
            annotation: options?.annotation,
            annotationType: options?.annotationType
          }, uploadId, offset, totalSize).subscribe({
            next: (response) => {
              uploadId = response.id;
              offset = response.offset;

              const progress = (offset / totalSize) * 100;
              if (options?.onProgress) {
                options.onProgress(progress);
              }

              uploadNextChunk();
            },
            error: (error) => subscriber.error(error)
          });
        }).catch(error => subscriber.error(error));
      };

      uploadNextChunk();
    });
  }

  completeSessionAnnotationFolderUploadWithFile(
    request: SessionAnnotationFolderChunkedUploadRequest
  ): Observable<AnnotationChunkedUploadCompletionResponse> {
    const hasher = new jsSHA('SHA-256', 'ARRAYBUFFER');
    const arrayBufferPromise = request.file.arrayBuffer();

    return from(arrayBufferPromise).pipe(
      switchMap((arrayBuffer) => {
        hasher.update(arrayBuffer);
        const hash = hasher.getHash('HEX');

        const formData = new FormData();
        formData.append('file', request.file);
        if (request.filename) {
          formData.append('filename', request.filename);
        }
        formData.append('session_id', request.sessionId.toString());
        formData.append('folder_id', request.folderId.toString());
        if (request.annotation) {
          formData.append('annotation', request.annotation);
        }
        if (request.annotationType) {
          formData.append('annotation_type', request.annotationType);
        }
        formData.append('sha256', hash);

        return this.post<AnnotationChunkedUploadCompletionResponse>(
          `${this.apiUrl}/upload/session-annotation-folder-chunks/`,
          formData
        );
      })
    );
  }

  cancelUpload(uploadId: string, uploadType: 'step' | 'session' | 'session-folder'): Observable<void> {
    let endpoint: string;
    if (uploadType === 'step') {
      endpoint = `upload/step-annotation-chunks`;
    } else if (uploadType === 'session') {
      endpoint = `upload/session-annotation-chunks`;
    } else {
      endpoint = `upload/session-annotation-folder-chunks`;
    }
    return this.delete<void>(`${this.apiUrl}/${endpoint}/${uploadId}/`);
  }
}
