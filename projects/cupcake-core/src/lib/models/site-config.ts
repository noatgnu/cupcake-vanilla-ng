import { BaseTimestampedModel } from './base';

export interface SiteConfig extends BaseTimestampedModel {
  siteName: string;
  logoUrl?: string;
  logoImage?: string;
  primaryColor?: string;
  showPoweredBy: boolean;
  allowUserRegistration: boolean;
  enableOrcidLogin: boolean;
  installedApps: {
    [appCode: string]: {
      name: string;
      code: string;
      description: string;
      installed: boolean;
    };
  };
  updatedBy?: number;
}

export interface SiteConfigUpdateRequest {
  siteName?: string;
  logoUrl?: string;
  logoImage?: string;
  primaryColor?: string;
  showPoweredBy?: boolean;
  allowUserRegistration?: boolean;
  enableOrcidLogin?: boolean;
}

export interface AuthConfig {
  registrationEnabled: boolean;
  orcidLoginEnabled: boolean;
  regularLoginEnabled: boolean;
}

export interface RegistrationStatus {
  registrationEnabled: boolean;
  message: string;
}

