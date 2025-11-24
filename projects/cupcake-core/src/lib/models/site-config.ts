import { BaseTimestampedModel } from './base';

export interface UIFeatures {
  [featureName: string]: boolean|undefined;
  show_metadata_tables?: boolean;
  show_instruments?: boolean;
  show_sessions?: boolean;
  show_protocols?: boolean;
  show_messages?: boolean;
  show_notifications?: boolean;
  show_storage?: boolean;
  show_webrtc?: boolean;
  show_billing?: boolean;
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
  whisperCppModel: string;
  uiFeatures: UIFeatures;
  uiFeaturesWithDefaults: UIFeatures;
  installedApps: {
    [appCode: string]: {
      name: string;
      code: string;
      description: string;
      installed: boolean;
    };
  };
  updatedBy?: number;
  demoMode?: boolean;
  demoCleanupIntervalMinutes?: number;
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
  whisperCppModel?: string;
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

