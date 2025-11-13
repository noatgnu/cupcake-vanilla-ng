import { BaseTimestampedModel } from './base';

export interface UIFeatures {
  [featureName: string]: boolean;
  show_metadata_tables?: boolean;
  show_instruments?: boolean;
  show_sessions?: boolean;
  show_protocols?: boolean;
  show_messages?: boolean;
  show_notifications?: boolean;
  show_sample_management?: boolean;
  show_webrtc?: boolean;
}

export interface SiteConfig extends BaseTimestampedModel {
  siteName: string;
  logoUrl?: string;
  logoImage?: string;
  primaryColor?: string;
  showPoweredBy: boolean;
  allowUserRegistration: boolean;
  enableOrcidLogin: boolean;
  bookingDeletionWindowMinutes: number;
  uiFeatures: UIFeatures;
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
  bookingDeletionWindowMinutes?: number;
  uiFeatures?: UIFeatures;
}

export interface AuthConfig {
  registrationEnabled: boolean;
  orcidLoginEnabled: boolean;
  regularLoginEnabled: boolean;
  jwtTokenLifetimes?: {
    default: {
      accessTokenMinutes: number;
      refreshTokenDays: number;
    };
    rememberMe: {
      accessTokenHours: number;
      refreshTokenDays: number;
    };
  };
}

export interface RegistrationStatus {
  registrationEnabled: boolean;
  message: string;
}

