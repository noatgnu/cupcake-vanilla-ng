import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from '@cupcake/core';

import {
  ExternalContact,
  ExternalContactCreateRequest,
  ExternalContactUpdateRequest,
  ExternalContactDetails,
  ExternalContactDetailsCreateRequest,
  ExternalContactDetailsUpdateRequest,
  ContactType,
  PaginatedResponse
} from '../models';

export interface ExternalContactQueryParams {
  search?: string;
  user?: number;
  limit?: number;
  offset?: number;
  ordering?: string;
}

export interface ExternalContactDetailsQueryParams {
  search?: string;
  contactType?: ContactType;
  limit?: number;
  offset?: number;
  ordering?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService extends BaseApiService {

  // ===== EXTERNAL CONTACT METHODS =====

  /**
   * Get all external contacts with optional filtering
   */
  getExternalContacts(params?: ExternalContactQueryParams): Observable<PaginatedResponse<ExternalContact>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<ExternalContact>>(`${this.apiUrl}/external-contacts/`, { params: httpParams });
  }

  /**
   * Get a single external contact by ID
   */
  getExternalContact(id: number): Observable<ExternalContact> {
    return this.get<ExternalContact>(`${this.apiUrl}/external-contacts/${id}/`);
  }

  /**
   * Create a new external contact
   */
  createExternalContact(contact: ExternalContactCreateRequest): Observable<ExternalContact> {
    return this.post<ExternalContact>(`${this.apiUrl}/external-contacts/`, contact);
  }

  /**
   * Update an existing external contact
   */
  updateExternalContact(id: number, contact: ExternalContactUpdateRequest): Observable<ExternalContact> {
    return this.put<ExternalContact>(`${this.apiUrl}/external-contacts/${id}/`, contact);
  }

  /**
   * Partially update an external contact
   */
  patchExternalContact(id: number, contact: Partial<ExternalContactUpdateRequest>): Observable<ExternalContact> {
    return this.patch<ExternalContact>(`${this.apiUrl}/external-contacts/${id}/`, contact);
  }

  /**
   * Delete an external contact
   */
  deleteExternalContact(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/external-contacts/${id}/`);
  }

  /**
   * Search external contacts by name
   */
  searchExternalContacts(query: string): Observable<PaginatedResponse<ExternalContact>> {
    return this.getExternalContacts({ search: query });
  }

  /**
   * Get external contacts for a specific user
   */
  getUserExternalContacts(userId: number): Observable<PaginatedResponse<ExternalContact>> {
    return this.getExternalContacts({ user: userId });
  }

  // ===== EXTERNAL CONTACT DETAILS METHODS =====

  /**
   * Get all external contact details with optional filtering
   */
  getExternalContactDetails(params?: ExternalContactDetailsQueryParams): Observable<PaginatedResponse<ExternalContactDetails>> {
    const httpParams = this.buildHttpParams(params);
    return this.get<PaginatedResponse<ExternalContactDetails>>(`${this.apiUrl}/external-contact-details/`, { params: httpParams });
  }

  /**
   * Get a single external contact detail by ID
   */
  getExternalContactDetail(id: number): Observable<ExternalContactDetails> {
    return this.get<ExternalContactDetails>(`${this.apiUrl}/external-contact-details/${id}/`);
  }

  /**
   * Create a new external contact detail
   */
  createExternalContactDetail(detail: ExternalContactDetailsCreateRequest): Observable<ExternalContactDetails> {
    return this.post<ExternalContactDetails>(`${this.apiUrl}/external-contact-details/`, detail);
  }

  /**
   * Update an existing external contact detail
   */
  updateExternalContactDetail(id: number, detail: ExternalContactDetailsUpdateRequest): Observable<ExternalContactDetails> {
    return this.put<ExternalContactDetails>(`${this.apiUrl}/external-contact-details/${id}/`, detail);
  }

  /**
   * Partially update an external contact detail
   */
  patchExternalContactDetail(id: number, detail: Partial<ExternalContactDetailsUpdateRequest>): Observable<ExternalContactDetails> {
    return this.patch<ExternalContactDetails>(`${this.apiUrl}/external-contact-details/${id}/`, detail);
  }

  /**
   * Delete an external contact detail
   */
  deleteExternalContactDetail(id: number): Observable<void> {
    return this.delete<void>(`${this.apiUrl}/external-contact-details/${id}/`);
  }

  /**
   * Get contact details by type
   */
  getContactDetailsByType(type: ContactType): Observable<PaginatedResponse<ExternalContactDetails>> {
    return this.getExternalContactDetails({ contactType: type });
  }

  /**
   * Search contact details
   */
  searchExternalContactDetails(query: string): Observable<PaginatedResponse<ExternalContactDetails>> {
    return this.getExternalContactDetails({ search: query });
  }
}
