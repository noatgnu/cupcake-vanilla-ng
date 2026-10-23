import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CUPCAKE_CORE_CONFIG } from '@noatgnu/cupcake-core';

import { ProtocolsIOBrowseService } from './protocols-io-browse';
import { ProtocolsIOBrowseEntry, ProtocolsIOPage, ProtocolsIOWorkspace } from '../models';

describe('ProtocolsIOBrowseService', () => {
  let service: ProtocolsIOBrowseService;
  let httpMock: HttpTestingController;
  const pageFields = { page: 1, total_pages: 2, total_results: 12, has_next: true };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CUPCAKE_CORE_CONFIG, useValue: { apiUrl: '/api' } },
        ProtocolsIOBrowseService
      ]
    });
    service = TestBed.inject(ProtocolsIOBrowseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should list workspaces with paging', () => {
    let result: ProtocolsIOPage<ProtocolsIOWorkspace> | undefined;
    service.getWorkspaces(2).subscribe(page => result = page);

    const request = httpMock.expectOne(req => req.url === '/api/protocols-io/browse/workspaces/');
    expect(request.request.params.get('page')).toBe('2');
    request.flush({ items: [{ uri: 'lrrk2', title: 'lrrk2', description: '' }], ...pageFields });

    expect(result).toEqual({
      items: [{ uri: 'lrrk2', title: 'lrrk2', description: '' }],
      page: 1,
      totalPages: 2,
      totalResults: 12,
      hasNext: true
    });
  });

  it('should leave out the page when none is given', () => {
    service.getWorkspaces().subscribe();
    const request = httpMock.expectOne(req => req.url === '/api/protocols-io/browse/workspaces/');
    expect(request.request.params.has('page')).toBeFalse();
    request.flush({ items: [], ...pageFields });
  });

  it('should list the folders of a workspace', () => {
    service.getWorkspaceItems('lrrk2').subscribe();
    const request = httpMock.expectOne(req => req.url === '/api/protocols-io/browse/workspace_items/');
    expect(request.request.params.get('workspace')).toBe('lrrk2');
    request.flush({ items: [], ...pageFields });
  });

  it('should list folder contents as folders and protocols in camel case', () => {
    let items: ProtocolsIOBrowseEntry[] = [];
    service.getFolderItems('C5463D4BF23D11ECA31A0A58A9FEAC02', 3).subscribe(page => items = page.items);

    const request = httpMock.expectOne(req => req.url === '/api/protocols-io/browse/folder_items/');
    expect(request.request.params.get('folder')).toBe('C5463D4BF23D11ECA31A0A58A9FEAC02');
    expect(request.request.params.get('page')).toBe('3');
    request.flush({
      items: [
        { kind: 'folder', title: 'Gels', guid: 'A1', parent_guid: 'C5', has_subfolders: false, workspace: { id: 59673, title: 'lrrk2' } },
        {
          kind: 'protocol', title: 'Cupcake export test', id: 340067, uri: 'cupcake-export-test-kqcbcvssp',
          protocol_type: 'protocol', importable: true, last_modified: 1792352685, workspace: { id: 59673, title: 'lrrk2' }
        }
      ],
      ...pageFields
    });

    expect(items[0]).toEqual({ kind: 'folder', title: 'Gels', guid: 'A1', parentGuid: 'C5', hasSubfolders: false, workspace: { id: 59673, title: 'lrrk2' } });
    expect(items[1].kind).toBe('protocol');
    if (items[1].kind === 'protocol') {
      expect(items[1].protocolType).toBe('protocol');
      expect(items[1].lastModified).toBe(1792352685);
    }
  });

  it('should search protocols', () => {
    service.search('cupcake').subscribe();
    const request = httpMock.expectOne(req => req.url === '/api/protocols-io/browse/search/');
    expect(request.request.params.get('q')).toBe('cupcake');
    request.flush({ items: [], ...pageFields });
  });
});
