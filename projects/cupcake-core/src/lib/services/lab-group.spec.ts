import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LabGroupService } from './lab-group';
import { CUPCAKE_CORE_CONFIG } from './auth';

describe('LabGroupService', () => {
  let service: LabGroupService;
  let httpMock: HttpTestingController;
  const mockConfig = {
    apiUrl: 'https://api.test.com',
    siteName: 'Test Site'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LabGroupService,
        { provide: CUPCAKE_CORE_CONFIG, useValue: mockConfig }
      ]
    });
    service = TestBed.inject(LabGroupService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Lab Groups', () => {
    it('should get lab groups with parameters', (done) => {
      const params = { search: 'test', limit: 10 };
      const mockResponse = {
        count: 1,
        results: [{ id: 1, name: 'Test Lab', description: 'Test description' }]
      };

      service.getLabGroups(params).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/lab-groups/` && 
        req.params.get('search') === 'test' &&
        req.params.get('limit') === '10'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get lab groups without parameters', (done) => {
      const mockResponse = {
        count: 2,
        results: [
          { id: 1, name: 'Lab 1', description: 'Description 1' },
          { id: 2, name: 'Lab 2', description: 'Description 2' }
        ]
      };

      service.getLabGroups().subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/lab-groups/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get my lab groups', (done) => {
      const mockResponse = {
        count: 1,
        results: [{ id: 1, name: 'My Lab', description: 'My lab description' }]
      };

      service.getMyLabGroups().subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/lab-groups/my_groups/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should create lab group', (done) => {
      const labGroupData = { name: 'New Lab', description: 'New description' };
      const mockResponse = { id: 1, name: 'New Lab', description: 'New description' };

      service.createLabGroup(labGroupData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/lab-groups/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ name: 'New Lab', description: 'New description' });
      req.flush(mockResponse);
    });

    it('should update lab group', (done) => {
      const labGroupId = 1;
      const updateData = { name: 'Updated Lab' };
      const mockResponse = { id: 1, name: 'Updated Lab', description: 'Original description' };

      service.updateLabGroup(labGroupId, updateData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/lab-groups/1/`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ name: 'Updated Lab' });
      req.flush(mockResponse);
    });

    it('should delete lab group', (done) => {
      const labGroupId = 1;

      service.deleteLabGroup(labGroupId).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/lab-groups/1/`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Lab Group Members', () => {
    it('should get lab group members', (done) => {
      const labGroupId = 1;
      const mockResponse = [
        { id: 1, user: { id: 1, username: 'user1' }, role: 'admin' },
        { id: 2, user: { id: 2, username: 'user2' }, role: 'member' }
      ];

      service.getLabGroupMembers(labGroupId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/lab-groups/1/members/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should invite user to lab group', (done) => {
      const labGroupId = 1;
      const invitationData = { email: 'user@example.com', role: 'member' };
      const mockResponse = { id: 1, email: 'user@example.com', status: 'pending' };

      service.inviteUserToLabGroup(labGroupId, invitationData).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/lab-groups/1/invite_user/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'user@example.com', role: 'member' });
      req.flush(mockResponse);
    });

    it('should leave lab group', (done) => {
      const labGroupId = 1;
      const mockResponse = { message: 'Successfully left lab group' };

      service.leaveLabGroup(labGroupId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/lab-groups/1/leave/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should remove member from lab group', (done) => {
      const labGroupId = 1;
      const userId = 2;
      const mockResponse = { message: 'Member removed successfully' };

      service.removeMemberFromLabGroup(labGroupId, userId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/lab-groups/1/remove_member/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ user_id: userId });
      req.flush(mockResponse);
    });
  });

  describe('Lab Group Invitations', () => {
    it('should get lab group invitations with parameters', (done) => {
      const params = { labGroup: 1, status: 'pending' };
      const mockResponse = {
        count: 1,
        results: [{ id: 1, email: 'user@example.com', status: 'pending' }]
      };

      service.getLabGroupInvitations(params).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${mockConfig.apiUrl}/lab-group-invitations/` && 
        req.params.get('lab_group') === '1' &&
        req.params.get('status') === 'pending'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get my pending invitations', (done) => {
      const mockResponse = [
        { id: 1, labGroup: { name: 'Lab 1' }, status: 'pending' },
        { id: 2, labGroup: { name: 'Lab 2' }, status: 'pending' }
      ];

      service.getMyPendingInvitations().subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/lab-group-invitations/my_pending_invitations/`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should accept lab group invitation', (done) => {
      const invitationId = 1;
      const mockResponse = { 
        message: 'Invitation accepted', 
        invitation: { id: 1, status: 'accepted' } 
      };

      service.acceptLabGroupInvitation(invitationId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/lab-group-invitations/1/accept_invitation/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should reject lab group invitation', (done) => {
      const invitationId = 1;
      const mockResponse = { 
        message: 'Invitation rejected', 
        invitation: { id: 1, status: 'rejected' } 
      };

      service.rejectLabGroupInvitation(invitationId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/lab-group-invitations/1/reject_invitation/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should cancel lab group invitation', (done) => {
      const invitationId = 1;
      const mockResponse = { message: 'Invitation cancelled' };

      service.cancelLabGroupInvitation(invitationId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/lab-group-invitations/1/cancel_invitation/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors', (done) => {
      service.getLabGroups().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.status).toBe(500);
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/lab-groups/`);
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network errors', (done) => {
      service.getLabGroups().subscribe(
        () => fail('should have failed'),
        error => {
          expect(error.name).toBe('HttpErrorResponse');
          done();
        }
      );

      const req = httpMock.expectOne(`${mockConfig.apiUrl}/lab-groups/`);
      req.error(new ErrorEvent('Network error'));
    });
  });
});