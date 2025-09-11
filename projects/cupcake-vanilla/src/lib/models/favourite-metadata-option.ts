import { BaseTimestampedModel } from './base';

export interface FavouriteMetadataOption extends BaseTimestampedModel {
  id: number;
  name: string;
  type: string;
  columnTemplate?: number;
  value: string;
  displayValue?: string;
  user?: number;
  userUsername?: string;
  labGroup?: number;
  labGroupName?: string;
  isGlobal: boolean;
}

export interface FavouriteMetadataOptionCreateRequest {
  name: string;
  type: string;
  columnTemplate?: number;
  value: string;
  displayValue?: string;
  user?: number;
  labGroup?: number;
  isGlobal?: boolean;
}

export interface FavouriteMetadataOptionUpdateRequest {
  name?: string;
  type?: string;
  columnTemplate?: number;
  value?: string;
  displayValue?: string;
  isGlobal?: boolean;
}