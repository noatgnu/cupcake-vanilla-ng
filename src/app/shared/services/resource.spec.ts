import { TestBed } from '@angular/core/testing';

import { ResourceService } from './resource';
import { ResourceVisibility, ResourceRole, BaseResource } from '../models';

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
        can_view: true,
        can_edit: false,
        can_delete: false,
        can_share: true
      };

      expect(service.canPerformAction(resource, 'view')).toBe(true);
      expect(service.canPerformAction(resource, 'edit')).toBe(false);
      expect(service.canPerformAction(resource, 'delete')).toBe(false);
      expect(service.canPerformAction(resource, 'share')).toBe(true);
    });

    it('should default view to true for backward compatibility', () => {
      const resource: BaseResource = {};
      expect(service.canPerformAction(resource, 'view')).toBe(true);
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

      const result = service.transformLegacyResource(legacyData);

      expect(result.owner).toBe(123);
      expect(result.ownerUsername).toBe('testuser');
      expect(result.visibility).toBe(ResourceVisibility.PUBLIC);
      expect(result.creator).toBeUndefined();
      expect(result.creatorUsername).toBeUndefined();
      expect(result.isPublic).toBeUndefined();
    });

    it('should set default values for missing fields', () => {
      const legacyData = { id: 1 };
      const result = service.transformLegacyResource(legacyData);

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

      const result = service.prepareForAPI(resourceData);

      expect(result.creator).toBe(123);
      expect(result.creatorUsername).toBe('testuser');
      expect(result.isPublic).toBe(true);
      expect(result.owner).toBeUndefined();
      expect(result.ownerUsername).toBeUndefined();
      expect(result.visibility).toBeUndefined();
    });
  });

  describe('getVisibilityOptions', () => {
    it('should return visibility options array', () => {
      const options = service.getVisibilityOptions();

      expect(options).toHaveLength(3);
      expect(options[0].value).toBe(ResourceVisibility.PRIVATE);
      expect(options[1].value).toBe(ResourceVisibility.GROUP);
      expect(options[2].value).toBe(ResourceVisibility.PUBLIC);
    });
  });

  describe('getRoleOptions', () => {
    it('should return role options array', () => {
      const options = service.getRoleOptions();

      expect(options).toHaveLength(4);
      expect(options[0].value).toBe(ResourceRole.VIEWER);
      expect(options[1].value).toBe(ResourceRole.EDITOR);
      expect(options[2].value).toBe(ResourceRole.ADMIN);
      expect(options[3].value).toBe(ResourceRole.OWNER);
    });
  });
});
