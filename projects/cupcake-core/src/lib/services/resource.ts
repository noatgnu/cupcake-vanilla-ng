import { Injectable } from '@angular/core';
import { BaseResource, ResourceVisibility, ResourceRole } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ResourceService {

  convertLegacyVisibility(isPublic: boolean | undefined, isDefault: boolean = false): ResourceVisibility {
    if (isDefault || isPublic) {
      return ResourceVisibility.PUBLIC;
    }
    return ResourceVisibility.PRIVATE;
  }

  convertToLegacyVisibility(visibility: ResourceVisibility): boolean {
    return visibility === ResourceVisibility.PUBLIC;
  }

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

  canPerformAction(resource: BaseResource, action: 'view' | 'edit' | 'delete' | 'share'): boolean {
    switch (action) {
      case 'view':
        return resource.canView ?? true;
      case 'edit':
        return resource.canEdit ?? false;
      case 'delete':
        return resource.canDelete ?? false;
      case 'share':
        // Share permission is based on ownership or admin role
        // This would typically require checking permissions via API
        return resource.canEdit ?? false;
      default:
        return false;
    }
  }

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

  transformLegacyResource<T extends Partial<BaseResource>>(legacyData: any): T {
    const transformed = { ...legacyData };

    if (legacyData.creator !== undefined) {
      transformed.owner = legacyData.creator;
      delete transformed.creator;
    }
    if (legacyData.creator_username !== undefined) {
      transformed.ownerUsername = legacyData.creator_username;
      delete transformed.creator_username;
    }

    if (legacyData.is_public !== undefined) {
      transformed.visibility = this.convertLegacyVisibility(legacyData.is_public, legacyData.is_default);
      delete transformed.is_public;
    }

    if (transformed.visibility === undefined) {
      transformed.visibility = ResourceVisibility.PRIVATE;
    }
    if (transformed.isActive === undefined) {
      transformed.isActive = true;
    }
    if (transformed.isLocked === undefined) {
      transformed.isLocked = false;
    }

    return transformed as T;
  }

  prepareForAPI<T extends Record<string, any>>(resourceData: T): any {
    const prepared: any = { ...resourceData };

    if (prepared.owner !== undefined) {
      prepared.creator = prepared.owner;
      delete prepared.owner;
    }
    if (prepared.ownerUsername !== undefined) {
      prepared.creator_username = prepared.ownerUsername;
      delete prepared.ownerUsername;
    }

    if (prepared.visibility !== undefined) {
      prepared.is_public = this.convertToLegacyVisibility(prepared.visibility);
      delete prepared.visibility;
    }

    return prepared;
  }
}
