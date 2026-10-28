// ==============================================================================
// Small Software Cloud - Core TypeScript Definitions
// ==============================================================================

export type LinkAccess = 'none' | 'view';
export type MemberRole = 'viewer' | 'editor';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface App {
  id: string;
  owner_id: string;
  title: string;
  current_version_id: string | null;
  link_access: LinkAccess;
  created_at: string;
  updated_at: string;
  // Computed / joined fields
  owner?: User;
  current_version?: AppVersion;
  role?: 'owner' | MemberRole | 'link_viewer';
}

export interface AppVersion {
  id: string;
  app_id: string;
  html: string;
  prompt: string;
  created_at: string;
}

export interface AppMember {
  id: string;
  app_id: string;
  email: string;
  user_id?: string | null;
  role: MemberRole;
  created_at: string;
  user?: User;
}

export interface AppKV {
  id: string;
  app_id: string;
  key: string;
  value: any;
  updated_by?: string | null;
  updated_at: string;
}

// SDK Bridge Messages via postMessage
export type SDKBridgeMessageType =
  | 'SDK_READY'
  | 'GET_USER'
  | 'STORE_GET'
  | 'STORE_SET'
  | 'STORE_LIST'
  | 'STORE_SUBSCRIBE'
  | 'STORE_UPDATE_BROADCAST';

export interface SDKBridgeRequest {
  type: SDKBridgeMessageType;
  requestId: string;
  appId: string;
  payload?: any;
}

export interface SDKBridgeResponse {
  type: 'SDK_RESPONSE';
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
}

export interface SDKBroadcastEvent {
  type: 'SDK_BROADCAST';
  appId: string;
  key: string;
  value: any;
  updatedBy?: string | null;
}
