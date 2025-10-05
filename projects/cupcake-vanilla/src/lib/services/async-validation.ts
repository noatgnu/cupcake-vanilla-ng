import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  MetadataValidationRequest,
  AsyncTaskCreateResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AsyncValidationService extends BaseApiService {

  metadataTable(request: MetadataValidationRequest): Observable<AsyncTaskCreateResponse> {
    return this.post<AsyncTaskCreateResponse>(`${this.apiUrl}/async-validation/metadata_table/`, request);
  }
}