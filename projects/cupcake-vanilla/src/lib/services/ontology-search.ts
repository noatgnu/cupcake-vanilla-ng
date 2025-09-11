import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

import {
  OntologySuggestion
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class OntologySearchService extends BaseApiService {

  /**
   * Get ontology suggestions across all sources for SDRF validation
   */
  suggest(params?: { query?: string; sources?: string[] }): Observable<OntologySuggestion[]> {
    const httpParams = this.buildHttpParams(params);
    return this.get<OntologySuggestion[]>(`${this.apiUrl}/ontology-search/suggest/`, { params: httpParams });
  }
}