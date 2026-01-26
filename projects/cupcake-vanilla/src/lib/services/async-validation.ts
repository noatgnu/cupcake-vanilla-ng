import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  MetadataValidationRequest,
  AsyncTaskCreateResponse,
  ValidationSchema
} from '@noatgnu/cupcake-core';

@Injectable({
  providedIn: 'root'
})
export class AsyncValidationService extends BaseApiService {

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
}