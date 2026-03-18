import { TestBed } from '@angular/core/testing';
import { ResourceService } from './resource';
import { ResourceVisibility, ResourceRole, BaseResource, ResourceType } from '../models';

describe('ResourceService', () => {
  let service: ResourceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ResourceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('convertLegacyVisibility', () => {
    it('should convert isPublic true to PUBLIC visibility', () => {
      const result = service.convertLegacyVisibility(true);
      expect(result).toBe(ResourceVisibility.PUBLIC);
    });

    it('should convert isPublic false to PRIVATE visibility', () => {
      const result = service.convertLegacyVisibility(false);
      expect(result).toBe(ResourceVisibility.PRIVATE);
    });

    it('should convert undefined to PRIVATE visibility', () => {
      const result = service.convertLegacyVisibility(undefined);
      expect(result).toBe(ResourceVisibility.PRIVATE);
    });

    it('should convert is_default true to PUBLIC visibility', () => {
      const result = service.convertLegacyVisibility(false, true);
      expect(result).toBe(ResourceVisibility.PUBLIC);
    });
  });

  describe('convertToLegacyVisibility', () => {
    it('should convert PUBLIC visibility to true', () => {
      const result = service.convertToLegacyVisibility(ResourceVisibility.PUBLIC);
      expect(result).toBe(true);
    });

    it('should convert PRIVATE visibility to false', () => {
      const result = service.convertToLegacyVisibility(ResourceVisibility.PRIVATE);
      expect(result).toBe(false);
    });

    it('should convert GROUP visibility to false', () => {
      const result = service.convertToLegacyVisibility(ResourceVisibility.GROUP);
      expect(result).toBe(false);
    });
  });

  describe('getVisibilityLabel', () => {
    it('should return correct labels for visibility types', () => {
      expect(service.getVisibilityLabel(ResourceVisibility.PRIVATE)).toBe('Private');
      expect(service.getVisibilityLabel(ResourceVisibility.GROUP)).toBe('Lab Group');
      expect(service.getVisibilityLabel(ResourceVisibility.PUBLIC)).toBe('Public');
    });
  });

  describe('getRoleLabel', () => {
    it('should return correct labels for role types', () => {
      expect(service.getRoleLabel(ResourceRole.OWNER)).toBe('Owner');
      expect(service.getRoleLabel(ResourceRole.ADMIN)).toBe('Administrator');
      expect(service.getRoleLabel(ResourceRole.EDITOR)).toBe('Editor');
      expect(service.getRoleLabel(ResourceRole.VIEWER)).toBe('Viewer');
    });
  });

  describe('canPerformAction', () => {
    it('should check permissions correctly', () => {
      const resource: BaseResource = {
        id: 1,
        resourceType: ResourceType.METADATA_TABLE,
        visibility: ResourceVisibility.PRIVATE,
        isActive: true,
        isLocked: false,
        canView: true,
        canEdit: false,
        canDelete: false,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };

      expect(service.canPerformAction(resource, 'view')).toBe(true);
      expect(service.canPerformAction(resource, 'edit')).toBe(false);
      expect(service.canPerformAction(resource, 'delete')).toBe(false);
    });

    it('should default to false for missing permissions', () => {
      const resource: BaseResource = {
        id: 1,
        resourceType: ResourceType.METADATA_TABLE,
        visibility: ResourceVisibility.PRIVATE,
        isActive: true,
        isLocked: false,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      };
      expect(service.canPerformAction(resource, 'view')).toBe(false);
    });
  });

  describe('transformLegacyResource', () => {
    it('should transform creator fields to owner fields', () => {
      const legacyData = {
        id: 1,
        creator: 123,
        creator_username: 'testuser',
        isPublic: true
      };

      const result = service.transformLegacyResource(legacyData) as any;

      expect(result.owner).toBe(123);
      expect(result.owner_username).toBe('testuser');
      expect(result.visibility).toBe(ResourceVisibility.PUBLIC);
      expect(result.creator).toBeUndefined();
    });

    it('should set default values for missing fields', () => {
      const legacyData = { id: 1 };
      const result = service.transformLegacyResource(legacyData) as any;

      expect(result.visibility).toBe(ResourceVisibility.PRIVATE);
      expect(result.isActive).toBe(true);
      expect(result.isLocked).toBe(false);
    });
  });

  describe('prepareForAPI', () => {
    it('should convert owner fields back to creator fields', () => {
      const resourceData = {
        id: 1,
        owner: 123,
        owner_username: 'testuser',
        visibility: ResourceVisibility.PUBLIC
      };

      const result = service.prepareForAPI(resourceData as any);

      expect(result.creator).toBe(123);
      expect(result.creator_username).toBe('testuser');
      expect(result.isPublic).toBe(true);
      expect(result.owner).toBeUndefined();
      expect(result.owner_username).toBeUndefined();
      expect(result.visibility).toBeUndefined();
    });
  });

  describe('getVisibilityOptions', () => {
    it('should return visibility options array', () => {
      const options = service.getVisibilityOptions();

      expect(options.length).toBe(3);
      expect(options[0].value).toBe(ResourceVisibility.PRIVATE);
      expect(options[1].value).toBe(ResourceVisibility.GROUP);
      expect(options[2].value).toBe(ResourceVisibility.PUBLIC);
    });
  });

  describe('getRoleOptions', () => {
    it('should return role options array', () => {
      const options = service.getRoleOptions();

      expect(options.length).toBe(4);
      expect(options[0].value).toBe(ResourceRole.VIEWER);
      expect(options[1].value).toBe(ResourceRole.EDITOR);
      expect(options[2].value).toBe(ResourceRole.ADMIN);
      expect(options[3].value).toBe(ResourceRole.OWNER);
    });
  });
});
