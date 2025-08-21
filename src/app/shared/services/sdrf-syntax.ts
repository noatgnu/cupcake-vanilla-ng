import { Injectable } from '@angular/core';

// Interfaces for different syntax types
export interface AgeFormat {
  years?: number;
  months?: number;
  days?: number;
  isRange?: boolean;
  rangeStart?: AgeFormat;
  rangeEnd?: AgeFormat;
}

export interface ModificationParameters {
  NT?: string; // Name of Term (supports typeahead)
  AC?: string; // Accession
  CF?: string; // Chemical Formula
  MT?: string; // Modification Type (Fixed/Variable/Annotated)
  PP?: string; // Position in Polypeptide
  TA?: string; // Target Amino acid
  MM?: string; // Monoisotopic Mass
  TS?: string; // Target Site regex
}

export interface CleavageAgentDetails {
  NT?: string; // Name of Term (supports typeahead)
  AC?: string; // Accession
  CS?: string; // Cleavage Site regex
}

export interface SpikedCompound {
  SP?: string; // spike name
  CT?: string; // compound type
  QY?: string; // quantity
  PS?: string; // purity specification
  AC?: string; // accession
  CN?: string; // compound name
  CV?: string; // controlled vocabulary
  CS?: string; // chemical structure
  CF?: string; // chemical formula
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export type SyntaxType = 'age' | 'modification' | 'cleavage' | 'spiked_compound';

@Injectable({
  providedIn: 'root'
})
export class SdrfSyntaxService {

  private readonly SPECIAL_COLUMN_PATTERNS = {
    age: /\bage\b/i,
    modification: /modification|mod/i,
    cleavage: /cleavage|protease/i,
    spiked_compound: /spike|compound|standard/i
  };

  private readonly MODIFICATION_KEYS = ['NT', 'AC', 'CF', 'MT', 'PP', 'TA', 'MM', 'TS'];
  private readonly CLEAVAGE_KEYS = ['NT', 'AC', 'CS'];
  private readonly SPIKED_COMPOUND_KEYS = ['SP', 'CT', 'QY', 'PS', 'AC', 'CN', 'CV', 'CS', 'CF'];

  /**
   * Detects if a column requires special SDRF syntax handling
   */
  detectSpecialSyntax(columnName: string, columnType: string): SyntaxType | null {
    const name = columnName.toLowerCase();
    const type = columnType.toLowerCase();

    if (this.SPECIAL_COLUMN_PATTERNS.age.test(name) || this.SPECIAL_COLUMN_PATTERNS.age.test(type)) {
      return 'age';
    }
    
    if (this.SPECIAL_COLUMN_PATTERNS.modification.test(name) || this.SPECIAL_COLUMN_PATTERNS.modification.test(type)) {
      return 'modification';
    }
    
    if (this.SPECIAL_COLUMN_PATTERNS.cleavage.test(name) || this.SPECIAL_COLUMN_PATTERNS.cleavage.test(type)) {
      return 'cleavage';
    }
    
    if (this.SPECIAL_COLUMN_PATTERNS.spiked_compound.test(name) || this.SPECIAL_COLUMN_PATTERNS.spiked_compound.test(type)) {
      return 'spiked_compound';
    }

    return null;
  }

  /**
   * Parses a value based on the syntax type
   */
  parseValue(syntaxType: SyntaxType, value: string): any {
    if (!value || value.trim() === '') {
      return null;
    }

    try {
      switch (syntaxType) {
        case 'age':
          return this.parseAgeFormat(value);
        case 'modification':
          return this.parseKeyValuePairs(value, this.MODIFICATION_KEYS);
        case 'cleavage':
          return this.parseKeyValuePairs(value, this.CLEAVAGE_KEYS);
        case 'spiked_compound':
          return this.parseKeyValuePairs(value, this.SPIKED_COMPOUND_KEYS);
        default:
          throw new Error(`Unknown syntax type: ${syntaxType}`);
      }
    } catch (error) {
      console.error(`Error parsing ${syntaxType} value:`, error);
      return null;
    }
  }

  /**
   * Formats parsed data back to string format
   */
  formatValue(syntaxType: SyntaxType, data: any): string {
    if (!data) {
      return '';
    }

    try {
      switch (syntaxType) {
        case 'age':
          return this.formatAgeFormat(data as AgeFormat);
        case 'modification':
        case 'cleavage':
        case 'spiked_compound':
          return this.formatKeyValuePairs(data);
        default:
          throw new Error(`Unknown syntax type: ${syntaxType}`);
      }
    } catch (error) {
      console.error(`Error formatting ${syntaxType} value:`, error);
      return '';
    }
  }

  /**
   * Validates parsed data
   */
  validateValue(syntaxType: SyntaxType, data: any): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!data) {
      result.isValid = false;
      result.errors.push('Value is required');
      return result;
    }

    try {
      switch (syntaxType) {
        case 'age':
          return this.validateAgeFormat(data as AgeFormat);
        case 'modification':
          return this.validateModificationParameters(data as ModificationParameters);
        case 'cleavage':
          return this.validateCleavageAgentDetails(data as CleavageAgentDetails);
        case 'spiked_compound':
          return this.validateSpikedCompound(data as SpikedCompound);
        default:
          result.isValid = false;
          result.errors.push(`Unknown syntax type: ${syntaxType}`);
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(`Validation error: ${error}`);
    }

    return result;
  }

  // Private helper methods

  private parseAgeFormat(value: string): AgeFormat {
    const trimmed = value.trim();
    
    // Check for range format (e.g., "20Y-30Y" or "2Y3M-3Y5M")
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-').map(s => s.trim());
      return {
        isRange: true,
        rangeStart: this.parseSingleAge(startStr),
        rangeEnd: this.parseSingleAge(endStr)
      };
    }

    return this.parseSingleAge(trimmed);
  }

  private parseSingleAge(ageStr: string): AgeFormat {
    const age: AgeFormat = {};
    
    // Match patterns like 25Y, 6M, 15D, 2Y3M, 1Y2M15D
    const yearMatch = ageStr.match(/(\d+)Y/);
    const monthMatch = ageStr.match(/(\d+)M/);
    const dayMatch = ageStr.match(/(\d+)D/);

    if (yearMatch) {
      age.years = parseInt(yearMatch[1], 10);
    }
    if (monthMatch) {
      age.months = parseInt(monthMatch[1], 10);
    }
    if (dayMatch) {
      age.days = parseInt(dayMatch[1], 10);
    }

    return age;
  }

  private formatAgeFormat(age: AgeFormat): string {
    if (age.isRange && age.rangeStart && age.rangeEnd) {
      return `${this.formatSingleAge(age.rangeStart)}-${this.formatSingleAge(age.rangeEnd)}`;
    }

    return this.formatSingleAge(age);
  }

  private formatSingleAge(age: AgeFormat): string {
    let result = '';
    if (age.years) result += `${age.years}Y`;
    if (age.months) result += `${age.months}M`;
    if (age.days) result += `${age.days}D`;
    return result;
  }

  private parseKeyValuePairs(value: string, validKeys: string[]): any {
    const result: any = {};
    
    // Split by semicolon and parse key=value pairs
    const pairs = value.split(';').map(pair => pair.trim()).filter(pair => pair);
    
    for (const pair of pairs) {
      const [key, ...valueParts] = pair.split('=');
      const keyTrimmed = key?.trim();
      const valueTrimmed = valueParts.join('=').trim();

      if (keyTrimmed && validKeys.includes(keyTrimmed)) {
        result[keyTrimmed] = valueTrimmed;
      }
    }

    return result;
  }

  private formatKeyValuePairs(data: any): string {
    const pairs: string[] = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '') {
        pairs.push(`${key}=${value}`);
      }
    }

    return pairs.join(';');
  }

  private validateAgeFormat(age: AgeFormat): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

    if (age.isRange) {
      if (!age.rangeStart || !age.rangeEnd) {
        result.isValid = false;
        result.errors.push('Range format requires both start and end values');
        return result;
      }

      const startValidation = this.validateSingleAge(age.rangeStart);
      const endValidation = this.validateSingleAge(age.rangeEnd);

      if (!startValidation.isValid) {
        result.isValid = false;
        result.errors.push(...startValidation.errors.map(e => `Range start: ${e}`));
      }

      if (!endValidation.isValid) {
        result.isValid = false;
        result.errors.push(...endValidation.errors.map(e => `Range end: ${e}`));
      }
    } else {
      const singleValidation = this.validateSingleAge(age);
      if (!singleValidation.isValid) {
        result.isValid = false;
        result.errors.push(...singleValidation.errors);
      }
    }

    return result;
  }

  private validateSingleAge(age: AgeFormat): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (!age.years && !age.months && !age.days) {
      result.isValid = false;
      result.errors.push('At least one age component (years, months, or days) is required');
    }

    if (age.years !== undefined && (age.years < 0 || age.years > 200)) {
      result.isValid = false;
      result.errors.push('Years must be between 0 and 200');
    }

    if (age.months !== undefined && (age.months < 0 || age.months > 11)) {
      result.isValid = false;
      result.errors.push('Months must be between 0 and 11');
    }

    if (age.days !== undefined && (age.days < 0 || age.days > 31)) {
      result.isValid = false;
      result.errors.push('Days must be between 0 and 31');
    }

    return result;
  }

  private validateModificationParameters(params: ModificationParameters): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

    // At least one parameter should be provided
    const hasAnyParam = Object.values(params).some(value => value !== undefined && value !== '');
    if (!hasAnyParam) {
      result.isValid = false;
      result.errors.push('At least one modification parameter is required');
    }

    // Validate specific parameters
    if (params.PP && !/^\d+$/.test(params.PP)) {
      result.errors.push('PP (protein position) must be a number');
      result.isValid = false;
    }

    if (params.MM && !/^\d+(\.\d+)?$/.test(params.MM)) {
      result.errors.push('MM (monoisotopic mass) must be a valid number');
      result.isValid = false;
    }

    return result;
  }

  private validateCleavageAgentDetails(details: CleavageAgentDetails): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    const hasAnyDetail = Object.values(details).some(value => value !== undefined && value !== '');
    if (!hasAnyDetail) {
      result.isValid = false;
      result.errors.push('At least one cleavage agent detail is required');
    }

    return result;
  }

  private validateSpikedCompound(compound: SpikedCompound): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

    const hasAnyParam = Object.values(compound).some(value => value !== undefined && value !== '');
    if (!hasAnyParam) {
      result.isValid = false;
      result.errors.push('At least one spiked compound parameter is required');
    }

    // Validate quantity format if provided
    if (compound.QY && !/^\d+(\.\d+)?\s*(mg|g|kg|μg|ng|pg|M|mM|μM|nM|pM)?$/i.test(compound.QY)) {
      result.warnings?.push('QY (quantity) format may not be standard - consider using standard units');
    }

    return result;
  }
}
