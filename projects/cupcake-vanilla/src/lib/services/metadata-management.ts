import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

@Injectable({
  providedIn: 'root'
})
export class MetadataManagementService extends BaseApiService {

  /**
   * Export metadata as Excel template (matching original CUPCAKE)
   */
  exportExcelTemplate(request: any): Observable<Blob> {
    return this.post(`${this.apiUrl}/metadata-management/export_excel_template/`, request, { responseType: 'blob' });
  }

  /**
   * Import metadata from SDRF file with intelligent column matching and schema organization
   */
  importSdrfFile(file: File, additionalData?: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }
    return this.post<any>(`${this.apiUrl}/metadata-management/import_sdrf_file/`, formData);
  }

  /**
   * Import metadata from Excel file (matching original CUPCAKE)
   */
  importExcelFile(file: File, additionalData?: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }
    return this.post<any>(`${this.apiUrl}/metadata-management/import_excel_file/`, formData);
  }

  /**
   * Collect metadata from metadata table
   */
  collectMetadata(params: any): Observable<any> {
    const httpParams = this.buildHttpParams(params);
    return this.get<any>(`${this.apiUrl}/metadata-management/collect_metadata/`, { params: httpParams });
  }

  /**
   * Export metadata as SDRF file (matching original CUPCAKE)
   */
  exportSdrfFile(request: any): Observable<Blob> {
    return this.post(`${this.apiUrl}/metadata-management/export_sdrf_file/`, request, { responseType: 'blob' });
  }
}