import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@noatgnu/cupcake-core';

import {
  OntologySuggestion
} from '../models';

export interface OntologySuggestParams {
  q: string;
  type?: string;
  match?: 'contains' | 'startswith';
  limit?: number;
  customFilters?: Record<string, any>;
}

export interface OntologySuggestResponse {
  ontologyType: string;
  suggestions: OntologySuggestion[];
  searchTerm: string;
  searchType: string;
  limit: number;
  count: number;
  customFilters?: Record<string, any>;
  hasMore: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OntologySearchService extends BaseApiService {

  /**
   * Get ontology suggestions across all sources for SDRF validation
   *
   * @param params Query parameters
   * @param params.q Search query (required, min 2 characters)
   * @param params.type Ontology type to search (optional)
   * @param params.match Match type - 'contains' or 'startswith' (default: 'contains')
   * @param params.limit Maximum number of results (default: 50)
   * @param params.customFilters Custom filters to apply (optional)
   *   Example: {"organism": "Homo sapiens"} or {"organism": {"icontains": "human"}}
   */
  suggest(params: OntologySuggestParams): Observable<OntologySuggestResponse> {
    const queryParams: any = {
      q: params.q,
    };

    if (params.type) {
      queryParams.type = params.type;
    }

    if (params.match) {
      queryParams.match = params.match;
    }

    if (params.limit) {
      queryParams.limit = params.limit;
    }

    if (params.customFilters) {
      queryParams.custom_filters = JSON.stringify(params.customFilters);
    }

    const httpParams = this.buildHttpParams(queryParams);
    return this.get<OntologySuggestResponse>(`${this.apiUrl}/ontology/search/suggest/`, { params: httpParams });
  }

  /**
   * Get ontology suggestions for a specific ontology type with custom filters
   */
  suggestWithFilters(
    query: string,
    ontologyType: string,
    customFilters: Record<string, any>,
    limit: number = 50
  ): Observable<OntologySuggestResponse> {
    return this.suggest({
      q: query,
      type: ontologyType,
      customFilters,
      limit
    });
  }

  /**
   * Search across multiple ontology types
   */
  searchAll(query: string, limit: number = 50): Observable<OntologySuggestResponse> {
    return this.suggest({
      q: query,
      limit
    });
  }

  /**
   * Search specific ontology type
   */
  searchType(query: string, ontologyType: string, limit: number = 50): Observable<OntologySuggestResponse> {
    return this.suggest({
      q: query,
      type: ontologyType,
      limit
    });
  }
}