import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { BaseApiService } from '@noatgnu/cupcake-core';
import { ChunkedUploadService } from './chunked-upload';

import {
  MetadataImportRequest,
  AsyncTaskCreateResponse
} from '@noatgnu/cupcake-core';

@Injectable({
  providedIn: 'root'
})
export class AsyncImportService extends BaseApiService {

  constructor(private chunkedUploadService: ChunkedUploadService) {
    super();
  }

  sdrfFile(request: MetadataImportRequest): Observable<AsyncTaskCreateResponse> {
    // Always use chunked upload - it handles everything (SHA256, chunking, processing)
    return this.chunkedUploadService.uploadFileInChunks(
      request.file,
      1024 * 1024, // 1MB chunks
      {
        metadataTableId: request.metadataTableId,
        createPools: true,
        replaceExisting: request.replaceExisting,
        onProgress: (progress) => {
          console.log(`SDRF upload progress: ${Math.round(progress)}%`);
        }
      }
    ).pipe(
      map(result => ({
        taskId: 'chunked-completed', // Processing is done immediately
        message: result.message || 'SDRF file processed successfully',
        result: result
      } as AsyncTaskCreateResponse))
    );
  }

  excelFile(request: MetadataImportRequest): Observable<AsyncTaskCreateResponse> {
    // Always use chunked upload - it handles everything (SHA256, chunking, processing)
    return this.chunkedUploadService.uploadFileInChunks(
      request.file,
      1024 * 1024, // 1MB chunks
      {
        metadataTableId: request.metadataTableId,
        createPools: true,
        replaceExisting: request.replaceExisting,
        onProgress: (progress) => {
          console.log(`Excel upload progress: ${Math.round(progress)}%`);
        }
      }
    ).pipe(
      map(result => ({
        taskId: 'chunked-completed', // Processing is done immediately
        message: result.message || 'Excel file processed successfully',
        result: result
      } as AsyncTaskCreateResponse))
    );
  }
}