import { Injectable } from '@angular/core';
import { BaseResource, ResourceVisibility, ResourceRole } from '../models/resource';

/**
 * Service to help with resource-related operations and data transformation
 */
@Injectable({
  providedIn: 'root'
})
export class ResourceService {

  /**
   * Convert legacy is_public field to new visibility enum
   */
  convertLegacyVisibility(isPublic: boolean | undefined, isDefault: boolean = false): ResourceVisibility {
    if (isDefault || isPublic) {
      return ResourceVisibility.PUBLIC;
    }
    return ResourceVisibility.PRIVATE;
  }

  /**
   * Convert new visibility enum to legacy is_public for backward compatibility
   */
  convertToLegacyVisibility(visibility: ResourceVisibility): boolean {
    return visibility === ResourceVisibility.PUBLIC;
  }

  /**
   * Get user-friendly visibility label
   */
  getVisibilityLabel(visibility: ResourceVisibility): string {
    switch (visibility) {
      case ResourceVisibility.PRIVATE:
        return 'Private';
      case ResourceVisibility.GROUP:
        return 'Lab Group';
      case ResourceVisibility.PUBLIC:
        return 'Public';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get user-friendly role label
   */
  getRoleLabel(role: ResourceRole): string {
    switch (role) {
      case ResourceRole.OWNER:
        return 'Owner';
      case ResourceRole.ADMIN:
        return 'Administrator';
      case ResourceRole.EDITOR:
        return 'Editor';
      case ResourceRole.VIEWER:
        return 'Viewer';
      default:
        return 'Unknown';
    }
  }

  /**
   * Check if user can perform action based on resource permissions
   */
  canPerformAction(resource: BaseResource, action: 'view' | 'edit' | 'delete' | 'share'): boolean {
    switch (action) {
      case 'view':
        return resource.can_view ?? true; // Default to true for backward compatibility
      case 'edit':
        return resource.can_edit ?? false;
      case 'delete':
        return resource.can_delete ?? false;
      case 'share':
        return resource.can_share ?? false;
      default:
        return false;
    }
  }

  /**
   * Get visibility options for dropdowns
   */
  getVisibilityOptions(): Array<{value: ResourceVisibility, label: string, description: string}> {
    return [
      {
        value: ResourceVisibility.PRIVATE,
        label: 'Private',
        description: 'Only you can access this resource'
      },
      {
        value: ResourceVisibility.GROUP,
        label: 'Lab Group',
        description: 'Members of your lab group can access this resource'
      },
      {
        value: ResourceVisibility.PUBLIC,
        label: 'Public',
        description: 'All users can access this resource'
      }
    ];
  }

  /**
   * Get role options for permission management
   */
  getRoleOptions(): Array<{value: ResourceRole, label: string, description: string}> {
    return [
      {
        value: ResourceRole.VIEWER,
        label: 'Viewer',
        description: 'Can view the resource'
      },
      {
        value: ResourceRole.EDITOR,
        label: 'Editor',
        description: 'Can view and edit the resource'
      },
      {
        value: ResourceRole.ADMIN,
        label: 'Administrator',
        description: 'Can view, edit, and manage permissions'
      },
      {
        value: ResourceRole.OWNER,
        label: 'Owner',
        description: 'Full control over the resource'
      }
    ];
  }

  /**
   * Transform legacy API response to include new resource fields
   * This helps during the transition period
   */
  transformLegacyResource<T extends Partial<BaseResource>>(legacyData: any): T {
    const transformed = { ...legacyData };

    // Transform creator fields to owner fields
    if (legacyData.creator !== undefined) {
      transformed.owner = legacyData.creator;
      delete transformed.creator;
    }
    if (legacyData.creator_username !== undefined) {
      transformed.owner_username = legacyData.creator_username;
      delete transformed.creator_username;
    }

    // Transform is_public to visibility
    if (legacyData.is_public !== undefined) {
      transformed.visibility = this.convertLegacyVisibility(legacyData.is_public, legacyData.is_default);
      delete transformed.is_public;
    }

    // Set default values for new fields if not present
    if (transformed.visibility === undefined) {
      transformed.visibility = ResourceVisibility.PRIVATE;
    }
    if (transformed.is_active === undefined) {
      transformed.is_active = true;
    }
    if (transformed.is_locked === undefined) {
      transformed.is_locked = false;
    }

    return transformed as T;
  }

  /**
   * Prepare resource data for API submission (convert back to legacy format if needed)
   */
  prepareForAPI<T extends Partial<BaseResource>>(resourceData: T): any {
    const prepared: any = { ...resourceData };

    // Convert owner fields back to creator fields for legacy API compatibility
    if (prepared.owner !== undefined) {
      prepared.creator = prepared.owner;
      delete prepared.owner;
    }
    if (prepared.owner_username !== undefined) {
      prepared.creator_username = prepared.owner_username;
      delete prepared.owner_username;
    }

    // Convert visibility back to is_public for legacy API compatibility
    if (prepared.visibility !== undefined) {
      prepared.is_public = this.convertToLegacyVisibility(prepared.visibility);
      delete prepared.visibility;
    }

    return prepared;
  }
}
