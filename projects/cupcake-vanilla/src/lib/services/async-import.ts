import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  private chunkedUploadService = inject(ChunkedUploadService);

  constructor() {
    super();
  }

  sdrfFile(request: MetadataImportRequest): Observable<AsyncTaskCreateResponse> {
    return this.chunkedUploadService.uploadFileInChunks(
      request.file,
      1024 * 1024,
      {
        metadataTableId: request.metadataTableId,
        createPools: true,
        replaceExisting: request.replaceExisting,
        applySchemaTemplates: request.applySchemaTemplates,
        onProgress: (_progress) => {}
      }
    ).pipe(
      map(result => ({
        taskId: result.taskId || '',
        message: result.message || 'SDRF file processed successfully',
        result: result
      } as AsyncTaskCreateResponse))
    );
  }

  excelFile(request: MetadataImportRequest): Observable<AsyncTaskCreateResponse> {
    return this.chunkedUploadService.uploadFileInChunks(
      request.file,
      1024 * 1024,
      {
        metadataTableId: request.metadataTableId,
        createPools: true,
        replaceExisting: request.replaceExisting,
        onProgress: (_progress) => {}
      }
    ).pipe(
      map(result => ({
        taskId: result.taskId || '',
        message: result.message || 'Excel file processed successfully',
        result: result
      } as AsyncTaskCreateResponse))
    );
  }
}
