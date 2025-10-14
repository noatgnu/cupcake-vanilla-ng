import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { BaseApiService } from '@noatgnu/cupcake-core';
import jsSHA from 'jssha';

import {
  ChunkedUploadStatus,
  ChunkedUploadRequest,
  ChunkedUploadResponse,
  ChunkedUploadCompletionRequest,
  ChunkedUploadCompletionResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ChunkedUploadService extends BaseApiService {


  /**
   * Initialize or continue a chunked upload
   */
  uploadChunk(
    request: ChunkedUploadRequest,
    uploadId?: string,
    offset?: number,
    totalSize?: number
  ): Observable<ChunkedUploadResponse> {
    const formData = new FormData();
    formData.append('file', request.file);

    if (request.filename) {
      formData.append('filename', request.filename);
    }
    if (request.uploadSessionId) {
      formData.append('upload_session_id', request.uploadSessionId);
    }
    if (request.metadataTableId) {
      formData.append('metadata_table_id', request.metadataTableId.toString());
    }
    if (request.createPools !== undefined) {
      formData.append('create_pools', request.createPools.toString());
    }
    if (request.replaceExisting !== undefined) {
      formData.append('replace_existing', request.replaceExisting.toString());
    }

    const url = uploadId
      ? `${this.apiUrl}/chunked-upload/${uploadId}/`
      : `${this.apiUrl}/chunked-upload/`;

    const httpOptions: any = {};
    const isChunkedUpload = offset !== undefined && totalSize !== undefined;

    if (isChunkedUpload) {
      const chunkEnd = offset + request.file.size - 1;
      httpOptions.headers = {
        'Content-Range': `bytes ${offset}-${chunkEnd}/${totalSize}`
      };
    }

    if (isChunkedUpload || uploadId) {
      return this.put<ChunkedUploadResponse>(url, formData, httpOptions);
    } else {
      return this.post<ChunkedUploadResponse>(url, formData, httpOptions);
    }
  }

  /**
   * Get chunked upload status
   */
  getUploadStatus(uploadId: string): Observable<ChunkedUploadStatus> {
    return this.get<ChunkedUploadStatus>(`${this.apiUrl}/chunked-upload/${uploadId}/`);
  }

  /**
   * Complete the chunked upload and process the file
   */
  completeUpload(uploadId: string, request?: ChunkedUploadCompletionRequest): Observable<ChunkedUploadCompletionResponse> {
    const formData = new FormData();

    if (request?.sha256) {
      formData.append('sha256', request.sha256);
    }
    if (request?.metadataTableId) {
      formData.append('metadata_table_id', request.metadataTableId.toString());
    }
    if (request?.createPools !== undefined) {
      formData.append('create_pools', request.createPools.toString());
    }
    if (request?.replaceExisting !== undefined) {
      formData.append('replace_existing', request.replaceExisting.toString());
    }

    return this.post<ChunkedUploadCompletionResponse>(`${this.apiUrl}/chunked-upload/${uploadId}/`, formData);
  }

  /**
   * Complete the chunked upload by uploading the entire file at once
   */
  completeUploadWithFile(request: ChunkedUploadRequest): Observable<ChunkedUploadCompletionResponse> {
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
        if (request.uploadSessionId) {
          formData.append('upload_session_id', request.uploadSessionId);
        }
        if (request.metadataTableId) {
          formData.append('metadata_table_id', request.metadataTableId.toString());
        }
        if (request.createPools !== undefined) {
          formData.append('create_pools', request.createPools.toString());
        }
        if (request.replaceExisting !== undefined) {
          formData.append('replace_existing', request.replaceExisting.toString());
        }
        formData.append('sha256', hash);

        return this.post<ChunkedUploadCompletionResponse>(`${this.apiUrl}/chunked-upload/`, formData);
      })
    );

  }

  /**
   * Delete/cancel a chunked upload
   */
  cancelUpload(uploadId: string): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/chunked-upload/${uploadId}/`);
  }

  /**
   * Helper method to upload a file in chunks with progress tracking
   */
  uploadFileInChunks(
    file: File,
    chunkSize: number = 1024 * 1024, // 1MB chunks by default
    options?: {
      metadataTableId?: number;
      createPools?: boolean;
      replaceExisting?: boolean;
      uploadSessionId?: string;
      onProgress?: (progress: number) => void;
    }
  ): Observable<ChunkedUploadCompletionResponse> {
    return new Observable(subscriber => {
      let uploadId: string | undefined;
      let offset = 0;
      const totalSize = file.size;
      const sha256 = new jsSHA('SHA-256', 'ARRAYBUFFER');
      if (totalSize <= chunkSize) {
        this.completeUploadWithFile({
          file: file,
          filename: file.name,
          uploadSessionId: options?.uploadSessionId,
          metadataTableId: options?.metadataTableId,
          createPools: options?.createPools,
          replaceExisting: options?.replaceExisting
        }).subscribe({
          next: (result) => {
            subscriber.next(result);
            subscriber.complete();
          }
        })
        return;
      }
      const uploadNextChunk = () => {
        if (offset >= totalSize) {
          if (uploadId) {
            const calculatedHash = sha256.getHash('HEX');
            this.completeUpload(uploadId, {
              sha256: calculatedHash,
              metadataTableId: options?.metadataTableId,
              createPools: options?.createPools,
              replaceExisting: options?.replaceExisting
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

          this.uploadChunk({
            file: chunkFile,
            filename: file.name,
            uploadSessionId: options?.uploadSessionId,
            metadataTableId: options?.metadataTableId,
            createPools: options?.createPools,
            replaceExisting: options?.replaceExisting
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
}
