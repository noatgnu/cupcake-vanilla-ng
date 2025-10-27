import { BaseTimestampedModel } from './base';

export enum ContactType {
  EMAIL = 'email',
  PHONE = 'phone',
  ADDRESS = 'address',
  OTHER = 'other'
}

export interface ExternalContactDetails extends BaseTimestampedModel {
  id: number;
  contactMethodAltName: string;
  contactType: ContactType;
  contactValue: string;
}

export interface ExternalContact extends BaseTimestampedModel {
  id: number;
  contactName: string;
  user?: number;
  ownerUsername?: string;
  contactDetails?: ExternalContactDetails[];
}

export interface ExternalContactDetailsCreateRequest {
  contactMethodAltName: string;
  contactType: ContactType;
  contactValue: string;
}

export interface ExternalContactDetailsUpdateRequest {
  contactMethodAltName?: string;
  contactType?: ContactType;
  contactValue?: string;
}

export interface ExternalContactCreateRequest {
  contactName: string;
  user?: number;
  contactDetailsIds?: number[];
}

export interface ExternalContactUpdateRequest {
  contactName?: string;
  user?: number;
  contactDetailsIds?: number[];
}