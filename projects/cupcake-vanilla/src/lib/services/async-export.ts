import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  MetadataExportRequest,
  BulkExportRequest,
  BulkExcelExportRequest,
  AsyncTaskCreateResponse
} from '@noatgnu/cupcake-core';

@Injectable({
  providedIn: 'root'
})
export class AsyncExportService extends BaseApiService {

  excelTemplate(request: MetadataExportRequest): Observable<AsyncTaskCreateResponse> {
    return this.post<AsyncTaskCreateResponse>(`${this.apiUrl}/async-export/excel_template/`, request);
  }

  sdrfFile(request: MetadataExportRequest): Observable<AsyncTaskCreateResponse> {
    return this.post<AsyncTaskCreateResponse>(`${this.apiUrl}/async-export/sdrf_file/`, request);
  }

  multipleSdrfFiles(request: BulkExportRequest): Observable<AsyncTaskCreateResponse> {
    return this.post<AsyncTaskCreateResponse>(`${this.apiUrl}/async-export/multiple_sdrf_files/`, request);
  }

  multipleExcelTemplates(request: BulkExcelExportRequest): Observable<AsyncTaskCreateResponse> {
    return this.post<AsyncTaskCreateResponse>(`${this.apiUrl}/async-export/multiple_excel_templates/`, request);
  }
}