import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';
import { BaseApiService } from '@noatgnu/cupcake-core';
import { ChunkedUploadService } from './chunked-upload';
import { AsyncTaskCreateResponse, ChunkedImportRequest } from '../models';

export interface ChunkedFileImportRequest {
  file: File;
  metadataTableId: number;
  replaceExisting?: boolean;
  validateOntologies?: boolean;
  createPools?: boolean;
}

export interface ChunkedImportProgress {
  uploadProgress: number;
  phase: 'uploading' | 'processing' | 'completed' | 'failed';
  taskId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChunkedImportService extends BaseApiService {

  constructor(private chunkedUploadService: ChunkedUploadService) {
    super();
  }

  /**
   * Import SDRF file using chunked upload for better performance with large files
   */
  importSdrfFileChunked(request: ChunkedFileImportRequest): Observable<AsyncTaskCreateResponse> {
    return this.validateFileType(request.file, ['.txt', '.tsv', '.sdrf']).pipe(
      switchMap(() => this.uploadFileChunked(request))
    );
  }

  /**
   * Import Excel file using chunked upload for better performance with large files
   */
  importExcelFileChunked(request: ChunkedFileImportRequest): Observable<AsyncTaskCreateResponse> {
    return this.validateFileType(request.file, ['.xlsx', '.xls']).pipe(
      switchMap(() => this.uploadFileChunked(request))
    );
  }

  /**
   * Generic chunked import that auto-detects file type
   */
  importFileChunked(request: ChunkedFileImportRequest): Observable<AsyncTaskCreateResponse> {
    const fileExtension = this.getFileExtension(request.file.name);

    if (['.txt', '.tsv', '.sdrf'].includes(fileExtension)) {
      return this.importSdrfFileChunked(request);
    } else if (['.xlsx', '.xls'].includes(fileExtension)) {
      return this.importExcelFileChunked(request);
    } else {
      return throwError(() => new Error(`Unsupported file type: ${fileExtension}`));
    }
  }

  /**
   * Upload file using chunked upload with metadata processing
   */
  private uploadFileChunked(request: ChunkedFileImportRequest): Observable<AsyncTaskCreateResponse> {
    return this.chunkedUploadService.uploadFileInChunks(
      request.file,
      1024 * 1024, // 1MB chunks
      {
        metadataTableId: request.metadataTableId,
        createPools: request.createPools,
        replaceExisting: request.replaceExisting,
        onProgress: (progress: number) => {
          // Upload progress callback - can be used for UI updates
          console.log(`Upload progress: ${Math.round(progress)}%`);
        }
      }
    ).pipe(
      switchMap((uploadResult) => {
        // Once upload is complete, trigger async processing
        return this.triggerAsyncImport(uploadResult, request);
      })
    );
  }

  /**
   * Trigger async import processing after chunked upload completion
   * This uses the existing async-import endpoints but with chunked upload completion
   */
  private triggerAsyncImport(uploadResult: any, request: ChunkedFileImportRequest): Observable<AsyncTaskCreateResponse> {
    // The chunked upload has completed, now we need to trigger async processing
    // We'll use the file from the completed upload result

    const fileExtension = this.getFileExtension(request.file?.name || '');

    if (['.txt', '.tsv', '.sdrf'].includes(fileExtension)) {
      // For SDRF files, we need to read the file content as text
      return from(request.file.text()).pipe(
        switchMap(fileContent => {
          const formData = new FormData();
          formData.append('metadata_table_id', request.metadataTableId.toString());
          formData.append('file_content', fileContent);
          formData.append('filename', request.file.name);

          if (request.replaceExisting !== undefined) {
            formData.append('replace_existing', request.replaceExisting.toString());
          }
          if (request.validateOntologies !== undefined) {
            formData.append('validate_ontologies', request.validateOntologies.toString());
          }

          return this.post<AsyncTaskCreateResponse>(`${this.apiUrl}/async-import/sdrf_file/`, formData);
        })
      );
    } else {
      // For Excel files, we can pass the file directly
      const formData = new FormData();
      formData.append('metadata_table_id', request.metadataTableId.toString());
      formData.append('file', request.file);

      if (request.replaceExisting !== undefined) {
        formData.append('replace_existing', request.replaceExisting.toString());
      }
      if (request.validateOntologies !== undefined) {
        formData.append('validate_ontologies', request.validateOntologies.toString());
      }

      return this.post<AsyncTaskCreateResponse>(`${this.apiUrl}/async-import/excel_file/`, formData);
    }
  }

  /**
   * Validate file type
   */
  private validateFileType(file: File, allowedExtensions: string[]): Observable<File> {
    const fileExtension = this.getFileExtension(file.name);

    if (!allowedExtensions.includes(fileExtension)) {
      return throwError(() => new Error(
        `Invalid file type. Expected: ${allowedExtensions.join(', ')}, got: ${fileExtension}`
      ));
    }

    return from(Promise.resolve(file));
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : '';
  }

  /**
   * Create progress observable for UI updates
   */
  createProgressObservable(
    request: ChunkedFileImportRequest,
    onProgress?: (progress: ChunkedImportProgress) => void
  ): Observable<AsyncTaskCreateResponse> {
    return new Observable(observer => {
      let currentPhase: ChunkedImportProgress['phase'] = 'uploading';

      // Report initial state
      if (onProgress) {
        onProgress({ uploadProgress: 0, phase: currentPhase });
      }

      // Start chunked upload with progress tracking
      this.chunkedUploadService.uploadFileInChunks(
        request.file,
        1024 * 1024, // 1MB chunks
        {
          metadataTableId: request.metadataTableId,
          createPools: request.createPools,
          replaceExisting: request.replaceExisting,
          onProgress: (progress: number) => {
            if (onProgress && currentPhase === 'uploading') {
              onProgress({
                uploadProgress: progress,
                phase: currentPhase
              });
            }
          }
        }
      ).pipe(
        tap(() => {
          // Upload completed, now processing
          currentPhase = 'processing';
          if (onProgress) {
            onProgress({ uploadProgress: 100, phase: currentPhase });
          }
        }),
        switchMap((uploadResult) => {
          return this.triggerAsyncImport(uploadResult, request);
        })
      ).subscribe({
        next: (result) => {
          currentPhase = 'completed';
          if (onProgress) {
            onProgress({
              uploadProgress: 100,
              phase: currentPhase,
              taskId: result.taskId
            });
          }
          observer.next(result);
          observer.complete();
        },
        error: (error) => {
          currentPhase = 'failed';
          if (onProgress) {
            onProgress({ uploadProgress: 0, phase: currentPhase });
          }
          observer.error(error);
        }
      });
    });
  }

  /**
   * Queue chunked file import task using completed chunked upload
   * This uses the new backend endpoint that processes already uploaded chunks
   */
  processChunkedUpload(request: ChunkedImportRequest): Observable<AsyncTaskCreateResponse> {
    const payload = {
      metadataTableId: request.metadataTableId,
      chunkedUploadId: request.chunkedUploadId,
      replaceExisting: request.replaceExisting,
      validateOntologies: request.validateOntologies,
      createPools: request.createPools
    };

    return this.post<AsyncTaskCreateResponse>(`${this.apiUrl}/async-import/chunked_file/`, payload);
  }
}
