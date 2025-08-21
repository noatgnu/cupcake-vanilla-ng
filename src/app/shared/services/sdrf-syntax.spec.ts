import { TestBed } from '@angular/core/testing';

import { SdrfSyntaxService, AgeFormat, ModificationParameters, CleavageAgentDetails, SpikedCompound } from './sdrf-syntax';

describe('SdrfSyntaxService', () => {
  let service: SdrfSyntaxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SdrfSyntaxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('detectSpecialSyntax', () => {
    it('should detect age syntax', () => {
      expect(service.detectSpecialSyntax('age', '')).toBe('age');
      expect(service.detectSpecialSyntax('organism age', '')).toBe('age');
      expect(service.detectSpecialSyntax('', 'age')).toBe('age');
    });

    it('should detect modification syntax', () => {
      expect(service.detectSpecialSyntax('modification', '')).toBe('modification');
      expect(service.detectSpecialSyntax('protein modification', '')).toBe('modification');
      expect(service.detectSpecialSyntax('', 'mod')).toBe('modification');
    });

    it('should detect cleavage syntax', () => {
      expect(service.detectSpecialSyntax('cleavage agent', '')).toBe('cleavage');
      expect(service.detectSpecialSyntax('protease', '')).toBe('cleavage');
    });

    it('should detect spiked compound syntax', () => {
      expect(service.detectSpecialSyntax('spike', '')).toBe('spiked_compound');
      expect(service.detectSpecialSyntax('compound', '')).toBe('spiked_compound');
      expect(service.detectSpecialSyntax('standard', '')).toBe('spiked_compound');
    });

    it('should return null for non-special columns', () => {
      expect(service.detectSpecialSyntax('normal column', 'string')).toBeNull();
      expect(service.detectSpecialSyntax('data', 'number')).toBeNull();
    });
  });

  describe('parseValue and formatValue - Age Format', () => {
    it('should parse simple age formats', () => {
      const result = service.parseValue('age', '25Y') as AgeFormat;
      expect(result.years).toBe(25);
      expect(result.isRange).toBeFalsy();
    });

    it('should parse complex age formats', () => {
      const result = service.parseValue('age', '2Y3M15D') as AgeFormat;
      expect(result.years).toBe(2);
      expect(result.months).toBe(3);
      expect(result.days).toBe(15);
    });

    it('should parse age ranges', () => {
      const result = service.parseValue('age', '20Y-30Y') as AgeFormat;
      expect(result.isRange).toBeTruthy();
      expect(result.rangeStart?.years).toBe(20);
      expect(result.rangeEnd?.years).toBe(30);
    });

    it('should format age back to string', () => {
      const ageData: AgeFormat = { years: 25, months: 6 };
      expect(service.formatValue('age', ageData)).toBe('25Y6M');
    });

    it('should format age range back to string', () => {
      const ageData: AgeFormat = {
        isRange: true,
        rangeStart: { years: 20 },
        rangeEnd: { years: 30 }
      };
      expect(service.formatValue('age', ageData)).toBe('20Y-30Y');
    });
  });

  describe('parseValue and formatValue - Modification Parameters', () => {
    it('should parse modification parameters', () => {
      const result = service.parseValue('modification', 'NT=Phosphorylation;AC=MOD:00696;PP=123') as ModificationParameters;
      expect(result.NT).toBe('Phosphorylation');
      expect(result.AC).toBe('MOD:00696');
      expect(result.PP).toBe('123');
    });

    it('should format modification parameters back to string', () => {
      const modData: ModificationParameters = {
        NT: 'Phosphorylation',
        AC: 'MOD:00696',
        PP: '123'
      };
      expect(service.formatValue('modification', modData)).toBe('NT=Phosphorylation;AC=MOD:00696;PP=123');
    });
  });

  describe('parseValue and formatValue - Cleavage Agent Details', () => {
    it('should parse cleavage agent details', () => {
      const result = service.parseValue('cleavage', 'NT=Trypsin;AC=MS:1001251;CS=KR') as CleavageAgentDetails;
      expect(result.NT).toBe('Trypsin');
      expect(result.AC).toBe('MS:1001251');
      expect(result.CS).toBe('KR');
    });

    it('should format cleavage agent details back to string', () => {
      const cleavageData: CleavageAgentDetails = {
        NT: 'Trypsin',
        AC: 'MS:1001251',
        CS: 'KR'
      };
      expect(service.formatValue('cleavage', cleavageData)).toBe('NT=Trypsin;AC=MS:1001251;CS=KR');
    });
  });

  describe('parseValue and formatValue - Spiked Compound', () => {
    it('should parse spiked compound parameters', () => {
      const result = service.parseValue('spiked_compound', 'SP=BSA;CT=protein;QY=1mg;AC=P02769') as SpikedCompound;
      expect(result.SP).toBe('BSA');
      expect(result.CT).toBe('protein');
      expect(result.QY).toBe('1mg');
      expect(result.AC).toBe('P02769');
    });

    it('should format spiked compound parameters back to string', () => {
      const spikedData: SpikedCompound = {
        SP: 'BSA',
        CT: 'protein',
        QY: '1mg',
        AC: 'P02769'
      };
      expect(service.formatValue('spiked_compound', spikedData)).toBe('SP=BSA;CT=protein;QY=1mg;AC=P02769');
    });
  });

  describe('validateValue', () => {
    it('should validate age format correctly', () => {
      const validAge: AgeFormat = { years: 25, months: 6 };
      const result = service.validateValue('age', validAge);
      expect(result.isValid).toBeTruthy();
      expect(result.errors.length).toBe(0);
    });

    it('should reject invalid age format', () => {
      const invalidAge: AgeFormat = { years: 250 }; // Too old
      const result = service.validateValue('age', invalidAge);
      expect(result.isValid).toBeFalsy();
      expect(result.errors).toContain('Years must be between 0 and 200');
    });

    it('should validate modification parameters correctly', () => {
      const validMod: ModificationParameters = { NT: 'Phosphorylation', PP: '123' };
      const result = service.validateValue('modification', validMod);
      expect(result.isValid).toBeTruthy();
    });

    it('should reject invalid modification parameters', () => {
      const invalidMod: ModificationParameters = { PP: 'invalid' }; // PP should be numeric
      const result = service.validateValue('modification', invalidMod);
      expect(result.isValid).toBeFalsy();
      expect(result.errors).toContain('PP (protein position) must be a number');
    });

    it('should validate cleavage agent details correctly', () => {
      const validCleavage: CleavageAgentDetails = { NT: 'Trypsin' };
      const result = service.validateValue('cleavage', validCleavage);
      expect(result.isValid).toBeTruthy();
    });

    it('should validate spiked compound correctly', () => {
      const validSpike: SpikedCompound = { SP: 'BSA', QY: '1mg' };
      const result = service.validateValue('spiked_compound', validSpike);
      expect(result.isValid).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should handle empty values gracefully', () => {
      expect(service.parseValue('age', '')).toBeNull();
      expect(service.parseValue('age', '   ')).toBeNull();
      expect(service.formatValue('age', null)).toBe('');
    });

    it('should handle invalid syntax types', () => {
      const result = service.validateValue('invalid' as any, {});
      expect(result.isValid).toBeFalsy();
      expect(result.errors[0]).toContain('Unknown syntax type');
    });
  });
});
