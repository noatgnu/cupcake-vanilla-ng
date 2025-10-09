import { BaseTimestampedModel } from './base';
import { StorageObjectType } from './enums';

/**
 * Represents a single item in a storage object's hierarchical path
 */
export interface StoragePathItem {
  id: number;
  name: string;
}

/**
 * Represents a storage object in the CCM system
 *
 * Storage objects can be organized hierarchically (e.g., Building > Floor > Room > Fridge > Shelf)
 *
 * @example
 * // Get full path as string for display
 * const pathString = StoragePathUtils.pathToString(storageObject.fullPath);
 * // "Main Building > Floor 2 > Lab 201 > Fridge A"
 *
 * @example
 * // Create breadcrumb navigation
 * storageObject.fullPath.map(item =>
 *   `<a href="/storage/${item.id}">${item.name}</a>`
 * )
 */
export interface StorageObject extends BaseTimestampedModel {
  id: number;
  objectType: StorageObjectType;
  objectName: string;
  objectDescription?: string;
  storedAt?: number;
  storedAtName?: string;
  /**
   * Full hierarchical path from root to current object
   * Each item contains {id, name} for navigation
   */
  fullPath: StoragePathItem[];
  remoteId?: number;
  remoteHost?: number;
  canDelete?: boolean;
  pngBase64?: string;
  user?: number;
  userUsername?: string;
  accessLabGroups?: number[];
  isVaulted: boolean;
}

export interface StorageObjectCreateRequest {
  objectType: StorageObjectType;
  objectName: string;
  objectDescription?: string;
  storedAt?: number;
  remoteId?: number;
  remoteHost?: number;
  pngBase64?: string;
  accessLabGroups?: number[];
}

export interface StorageObjectUpdateRequest {
  objectType?: StorageObjectType;
  objectName?: string;
  objectDescription?: string;
  storedAt?: number;
  pngBase64?: string;
  accessLabGroups?: number[];
  isVaulted?: boolean;
}