import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  AsyncTaskCreateResponse,
  MetadataValidationRequest,
  SdrfFileValidationRequest,
  ValidationSchema
} from '@noatgnu/cupcake-core';

import { ChunkedUploadService } from './chunked-upload';

@Injectable({
  providedIn: 'root'
})
export class AsyncValidationService extends BaseApiService {
  private chunkedUploadService = inject(ChunkedUploadService);

  getAvailableSchemas(): Observable<ValidationSchema[]> {
    return this.get<ValidationSchema[]>(`${this.apiUrl}/async-validation/available_schemas/`);
  }

  metadataTable(request: MetadataValidationRequest): Observable<AsyncTaskCreateResponse> {
    const payload = {
      metadata_table_id: request.metadataTableId,
      validate_sdrf_format: request.validateSdrfFormat ?? true,
      include_pools: request.includePools ?? true,
      schema_names: request.schemaNames ?? ['default'],
      skip_ontology: request.skipOntology ?? false
    };
    return this.post<AsyncTaskCreateResponse>(`${this.apiUrl}/async-validation/metadata_table/`, payload);
  }

  sdrfFile(request: SdrfFileValidationRequest): Observable<AsyncTaskCreateResponse> {
    return this.chunkedUploadService.uploadFileInChunks(request.file, 1024 * 1024, {
      validateOnly: true,
      schemaNames: request.schemaNames ?? ['default'],
      skipOntology: request.skipOntology ?? false,
      useOlsCacheOnly: request.useOlsCacheOnly ?? false
    }).pipe(
      map(response => ({
        taskId: response.taskId ?? '',
        message: response.message ?? 'SDRF validation task queued successfully'
      }))
    );
  }
}