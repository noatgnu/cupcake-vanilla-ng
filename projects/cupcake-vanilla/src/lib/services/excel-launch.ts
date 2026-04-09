import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';
import {
  ExcelLaunchRequest,
  ExcelLaunchCode,
  ExcelLaunchClaimRequest,
  ExcelLaunchClaimResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ExcelLaunchService extends BaseApiService {

  createLaunchCode(request: ExcelLaunchRequest): Observable<ExcelLaunchCode> {
    return this.post<ExcelLaunchCode>(`${this.apiUrl}/excel-launch/`, request);
  }

  claimLaunchCode(code: string): Observable<ExcelLaunchClaimResponse> {
    const request: ExcelLaunchClaimRequest = { code };
    return this.post<ExcelLaunchClaimResponse>(`${this.apiUrl}/excel-launch/claim/`, request);
  }
}
