import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { BaseApiService } from '@noatgnu/cupcake-core';
import jsSHA from 'jssha';

import {
  AnnotationChunkedUploadResponse,
  AnnotationChunkedUploadCompletionResponse,
  InstrumentAnnotationChunkedUploadRequest,
  InstrumentAnnotationChunkedUploadCompletionRequest,
  StoredReagentAnnotationChunkedUploadRequest,
  StoredReagentAnnotationChunkedUploadCompletionRequest
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AnnotationChunkedUploadService extends BaseApiService {

  uploadInstrumentAnnotationChunk(
    request: InstrumentAnnotationChunkedUploadRequest,
    uploadId?: string,
    offset?: number,
    totalSize?: number
  ): Observable<AnnotationChunkedUploadResponse> {
    const formData = new FormData();
    formData.append('file', request.file);

    if (request.filename) {
      formData.append('filename', request.filename);
    }
    formData.append('instrument_id', request.instrumentId.toString());
    formData.append('folder_id', request.folderId.toString());
    if (request.annotation) {
      formData.append('annotation', request.annotation);
    }
    if (request.annotationType) {
      formData.append('annotation_type', request.annotationType);
    }

    const url = uploadId
      ? `${this.apiUrl}/upload/instrument-annotation-chunks/${uploadId}/`
      : `${this.apiUrl}/upload/instrument-annotation-chunks/`;

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

  completeInstrumentAnnotationUpload(
    uploadId: string,
    request: InstrumentAnnotationChunkedUploadCompletionRequest
  ): Observable<AnnotationChunkedUploadCompletionResponse> {
    const formData = new FormData();
    formData.append('sha256', request.sha256);
    formData.append('instrument_id', request.instrumentId.toString());
    formData.append('folder_id', request.folderId.toString());
    if (request.annotation) {
      formData.append('annotation', request.annotation);
    }
    if (request.annotationType) {
      formData.append('annotation_type', request.annotationType);
    }

    return this.post<AnnotationChunkedUploadCompletionResponse>(
      `${this.apiUrl}/upload/instrument-annotation-chunks/${uploadId}/`,
      formData
    );
  }

  uploadInstrumentAnnotationFileInChunks(
    file: File,
    instrumentId: number,
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
        this.completeInstrumentAnnotationUploadWithFile({
          file: file,
          filename: file.name,
          instrumentId: instrumentId,
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
            this.completeInstrumentAnnotationUpload(uploadId, {
              sha256: calculatedHash,
              instrumentId: instrumentId,
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

          this.uploadInstrumentAnnotationChunk({
            file: chunkFile,
            filename: file.name,
            instrumentId: instrumentId,
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

  completeInstrumentAnnotationUploadWithFile(
    request: InstrumentAnnotationChunkedUploadRequest
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
        formData.append('instrument_id', request.instrumentId.toString());
        formData.append('folder_id', request.folderId.toString());
        if (request.annotation) {
          formData.append('annotation', request.annotation);
        }
        if (request.annotationType) {
          formData.append('annotation_type', request.annotationType);
        }
        formData.append('sha256', hash);

        return this.post<AnnotationChunkedUploadCompletionResponse>(
          `${this.apiUrl}/upload/instrument-annotation-chunks/`,
          formData
        );
      })
    );
  }

  uploadStoredReagentAnnotationChunk(
    request: StoredReagentAnnotationChunkedUploadRequest,
    uploadId?: string,
    offset?: number,
    totalSize?: number
  ): Observable<AnnotationChunkedUploadResponse> {
    const formData = new FormData();
    formData.append('file', request.file);

    if (request.filename) {
      formData.append('filename', request.filename);
    }
    formData.append('stored_reagent_id', request.storedReagentId.toString());
    formData.append('folder_id', request.folderId.toString());
    if (request.annotation) {
      formData.append('annotation', request.annotation);
    }
    if (request.annotationType) {
      formData.append('annotation_type', request.annotationType);
    }

    const url = uploadId
      ? `${this.apiUrl}/upload/stored-reagent-annotation-chunks/${uploadId}/`
      : `${this.apiUrl}/upload/stored-reagent-annotation-chunks/`;

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

  completeStoredReagentAnnotationUpload(
    uploadId: string,
    request: StoredReagentAnnotationChunkedUploadCompletionRequest
  ): Observable<AnnotationChunkedUploadCompletionResponse> {
    const formData = new FormData();
    formData.append('sha256', request.sha256);
    formData.append('stored_reagent_id', request.storedReagentId.toString());
    formData.append('folder_id', request.folderId.toString());
    if (request.annotation) {
      formData.append('annotation', request.annotation);
    }
    if (request.annotationType) {
      formData.append('annotation_type', request.annotationType);
    }

    return this.post<AnnotationChunkedUploadCompletionResponse>(
      `${this.apiUrl}/upload/stored-reagent-annotation-chunks/${uploadId}/`,
      formData
    );
  }

  uploadStoredReagentAnnotationFileInChunks(
    file: File,
    storedReagentId: number,
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
        this.completeStoredReagentAnnotationUploadWithFile({
          file: file,
          filename: file.name,
          storedReagentId: storedReagentId,
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
            this.completeStoredReagentAnnotationUpload(uploadId, {
              sha256: calculatedHash,
              storedReagentId: storedReagentId,
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

          this.uploadStoredReagentAnnotationChunk({
            file: chunkFile,
            filename: file.name,
            storedReagentId: storedReagentId,
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

  completeStoredReagentAnnotationUploadWithFile(
    request: StoredReagentAnnotationChunkedUploadRequest
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
        formData.append('stored_reagent_id', request.storedReagentId.toString());
        formData.append('folder_id', request.folderId.toString());
        if (request.annotation) {
          formData.append('annotation', request.annotation);
        }
        if (request.annotationType) {
          formData.append('annotation_type', request.annotationType);
        }
        formData.append('sha256', hash);

        return this.post<AnnotationChunkedUploadCompletionResponse>(
          `${this.apiUrl}/upload/stored-reagent-annotation-chunks/`,
          formData
        );
      })
    );
  }

  cancelUpload(uploadId: string, uploadType: 'instrument' | 'stored-reagent'): Observable<void> {
    const endpoint = uploadType === 'instrument'
      ? `upload/instrument-annotation-chunks`
      : `upload/stored-reagent-annotation-chunks`;
    return this.delete<void>(`${this.apiUrl}/${endpoint}/${uploadId}/`);
  }
}
