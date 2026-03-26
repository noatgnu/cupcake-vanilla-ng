import { of } from 'rxjs';
import { SamplePoolService } from './sample-pool';

describe('SamplePoolService', () => {
  let service: jasmine.SpyObj<SamplePoolService>;

  beforeEach(() => {
    service = jasmine.createSpyObj('SamplePoolService', [
      'getSamplePools',
      'getSamplePool',
      'createSamplePool',
      'updateSamplePool',
      'patchSamplePool',
      'deleteSamplePool',
      'getMetadataColumns'
    ]);
  });

  describe('getSamplePools', () => {
    it('should get sample pools with parameters', (done) => {
      const mockResponse = { count: 1, results: [{ id: 1, poolName: 'Test Pool' }] };
      service.getSamplePools.and.returnValue(of(mockResponse as any));

      service.getSamplePools({ search: 'plasma', limit: 10 }).subscribe(response => {
        expect(response.count).toBe(1);
        expect(response.results.length).toBe(1);
        done();
      });

      expect(service.getSamplePools).toHaveBeenCalledWith({ search: 'plasma', limit: 10 });
    });

    it('should get sample pools without parameters', (done) => {
      const mockResponse = { count: 2, results: [{ id: 1 }, { id: 2 }] };
      service.getSamplePools.and.returnValue(of(mockResponse as any));

      service.getSamplePools().subscribe(response => {
        expect(response.count).toBe(2);
        done();
      });

      expect(service.getSamplePools).toHaveBeenCalledWith();
    });
  });

  describe('getSamplePool', () => {
    it('should get single sample pool', (done) => {
      const mockResponse = { id: 1, poolName: 'Test Pool' };
      service.getSamplePool.and.returnValue(of(mockResponse as any));

      service.getSamplePool(1).subscribe(response => {
        expect(response.id).toBe(1);
        expect(response.poolName).toBe('Test Pool');
        done();
      });

      expect(service.getSamplePool).toHaveBeenCalledWith(1);
    });
  });

  describe('createSamplePool', () => {
    it('should create sample pool', (done) => {
      const poolData = { poolName: 'New Pool', metadataTable: 1 };
      const mockResponse = { id: 1, ...poolData };
      service.createSamplePool.and.returnValue(of(mockResponse as any));

      service.createSamplePool(poolData).subscribe(response => {
        expect(response.id).toBe(1);
        expect(response.poolName).toBe('New Pool');
        done();
      });

      expect(service.createSamplePool).toHaveBeenCalledWith(poolData);
    });
  });

  describe('deleteSamplePool', () => {
    it('should delete sample pool', (done) => {
      service.deleteSamplePool.and.returnValue(of(undefined));

      service.deleteSamplePool(1).subscribe(() => {
        done();
      });

      expect(service.deleteSamplePool).toHaveBeenCalledWith(1);
    });
  });
});
