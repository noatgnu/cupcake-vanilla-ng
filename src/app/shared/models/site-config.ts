export interface SiteConfig {
  site_name: string;
  logo_url?: string;
  logo_image?: string;
  primary_color?: string;
  show_powered_by?: boolean;
  allow_user_registration?: boolean;
  enable_orcid_login?: boolean;
  created_at?: string;
  updated_at?: string;
  updated_by?: number;
  updated_by_username?: string;
}

export interface AuthConfig {
  registration_enabled: boolean;
  orcid_login_enabled: boolean;
  regular_login_enabled: boolean;
}

export interface RegistrationStatus {
  registration_enabled: boolean;
  message: string;
}