export type PluginWidgetType =
  | 'card'
  | 'list'
  | 'form'
  | 'chart'
  | 'table'
  | 'iframe'
  | 'custom';

export interface PluginWidgetAction {
  label: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  confirm?: string;
}

export interface PluginWidgetDefinition {
  id: string;
  type: PluginWidgetType;
  title?: string;
  endpoint?: string;
  actions?: PluginWidgetAction[];
  fields?: string[];
  columns?: string[];
  src?: string;
  refreshInterval?: number;
}

export interface PluginNavItem {
  label: string;
  icon?: string;
  path: string;
}

export interface PluginPageDef {
  path: string;
  title: string;
  widgets: PluginWidgetDefinition[];
}

export interface PluginManifest {
  name: string;
  displayName: string;
  version: string;
  description?: string;
  baseUrl: string;
  nav?: PluginNavItem[];
  pages?: PluginPageDef[];
}

export interface Plugin {
  id: number;
  name: string;
  displayName: string;
  version: string;
  description: string;
  manifestCache: PluginManifest;
  baseUrl: string;
  isActive: boolean;
  registeredAt: string;
  updatedAt: string;
}

export interface PluginRegisterRequest {
  name: string;
  version: string;
  displayName?: string;
  description?: string;
  manifest: PluginManifest;
  baseUrl?: string;
}

export type PluginRecord = Record<string, string | number | boolean | null>;

export interface PluginCardData {
  [key: string]: string | number | boolean | null;
}

export interface PluginChartDataset {
  label: string;
  data: number[];
}

export interface PluginChartData {
  labels: string[];
  datasets: PluginChartDataset[];
}

export interface PluginFormResponse {
  success: boolean;
  message?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface PluginBroadcastPayload {
  [key: string]: string | number | boolean | null | PluginBroadcastPayload | PluginBroadcastPayload[];
}

export interface PluginBroadcastRequest {
  scope: 'global' | 'user' | 'lab_group';
  payload: PluginBroadcastPayload;
  userId?: number;
  labGroupId?: number;
}

export interface PluginSubscribeRequest {
  subscriptionType: 'plugin_updates';
  pluginId: number;
  scope: 'global' | 'user' | 'lab_group';
  labGroupId?: number;
}

export interface PluginMessage {
  type: 'plugin.message';
  pluginId: number;
  pluginName: string;
  scope: 'global' | 'user' | 'lab_group';
  payload: PluginBroadcastPayload;
}
