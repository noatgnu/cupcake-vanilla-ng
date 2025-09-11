import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { BaseApiService } from '@cupcake/core';

import {
  MetadataImportRequest,
  AsyncTaskCreateResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AsyncImportService extends BaseApiService {

  /**
   * Calculate SHA256 hash of a file
   */
  private async calculateSHA256(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  sdrfFile(request: MetadataImportRequest): Observable<AsyncTaskCreateResponse> {
    return from(this.calculateSHA256(request.file)).pipe(
      switchMap(sha256Hash => {
        const formData = new FormData();
        formData.append('metadata_table_id', request.metadataTableId.toString());
        formData.append('file', request.file);
        formData.append('sha256', sha256Hash);
        
        if (request.replaceExisting !== undefined) {
          formData.append('replace_existing', request.replaceExisting.toString());
        }
        if (request.validateOntologies !== undefined) {
          formData.append('validate_ontologies', request.validateOntologies.toString());
        }

        return this.post<AsyncTaskCreateResponse>(`${this.apiUrl}/async-import/sdrf_file/`, formData);
      })
    );
  }

  excelFile(request: MetadataImportRequest): Observable<AsyncTaskCreateResponse> {
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