import { StoragePathItem } from '../models';

/**
 * Utility functions for working with storage object paths
 */
export class StoragePathUtils {
  /**
   * Convert full path array to string representation
   */
  static pathToString(path: StoragePathItem[], separator: string = ' > '): string {
    return path.map(item => item.name).join(separator);
  }

  /**
   * Get the parent path (all items except the last one)
   */
  static getParentPath(path: StoragePathItem[]): StoragePathItem[] {
    return path.slice(0, -1);
  }

  /**
   * Get the root item from the path
   */
  static getRoot(path: StoragePathItem[]): StoragePathItem | null {
    return path.length > 0 ? path[0] : null;
  }

  /**
   * Get the current/leaf item from the path
   */
  static getCurrent(path: StoragePathItem[]): StoragePathItem | null {
    return path.length > 0 ? path[path.length - 1] : null;
  }

  /**
   * Get the depth/level of the storage object in the hierarchy
   */
  static getDepth(path: StoragePathItem[]): number {
    return path.length;
  }

  /**
   * Check if a storage object is at the root level
   */
  static isRoot(path: StoragePathItem[]): boolean {
    return path.length === 1;
  }

  /**
   * Get all parent IDs from the path
   */
  static getParentIds(path: StoragePathItem[]): number[] {
    return path.slice(0, -1).map(item => item.id);
  }

  /**
   * Get all IDs from the path including current
   */
  static getAllIds(path: StoragePathItem[]): number[] {
    return path.map(item => item.id);
  }

  /**
   * Find a specific item by ID in the path
   */
  static findById(path: StoragePathItem[], id: number): StoragePathItem | null {
    return path.find(item => item.id === id) || null;
  }

  /**
   * Check if a path contains a specific ID
   */
  static contains(path: StoragePathItem[], id: number): boolean {
    return path.some(item => item.id === id);
  }
}
