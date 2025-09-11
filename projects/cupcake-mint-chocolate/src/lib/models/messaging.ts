import { BaseTimestampedModel, UserBasic } from './base';
import { MessageType } from './enums';

export interface ThreadParticipant extends BaseTimestampedModel {
  id: number;
  user: number;
  username?: string;
  userDetails?: UserBasic;
  joinedAt: string;
  lastReadAt?: string;
  isModerator: boolean;
  notificationsEnabled: boolean;
}

export interface Message extends BaseTimestampedModel {
  id: string;
  thread: string;
  content: string;
  messageType: MessageType;
  sender: number;
  senderUsername?: string;
  senderDetails?: UserBasic;
  isEdited: boolean;
  isDeleted: boolean;
  replyTo?: string;
  replyToContent?: string;
  replyToSender?: string;
  annotationsCount: number;
}

export interface MessageThread extends BaseTimestampedModel {
  id: string;
  title: string;
  description?: string;
  creator: number;
  creatorUsername?: string;
  creatorDetails?: UserBasic;
  participantsCount: number;
  messagesCount: number;
  participantsList?: ThreadParticipant[];
  relatedObjectType?: string;
  relatedObjectApp?: string;
  objectId?: number;
  isPrivate: boolean;
  isArchived: boolean;
  allowExternalParticipants: boolean;
  lastMessageAt?: string;
  latestMessage?: Message;
}

export interface MessageThreadCreateRequest {
  title: string;
  description?: string;
  isPrivate?: boolean;
  allowExternalParticipants?: boolean;
  contentType?: number;
  objectId?: number;
  participantUsernames?: string[];
}

export interface MessageThreadUpdateRequest {
  title?: string;
  description?: string;
  isPrivate?: boolean;
  isArchived?: boolean;
  allowExternalParticipants?: boolean;
}

export interface MessageCreateRequest {
  thread: string;
  content: string;
  messageType?: MessageType;
  replyTo?: string;
}

export interface MessageUpdateRequest {
  content?: string;
}

export interface ThreadParticipantRequest {
  usernames: string[];
  isModerator?: boolean;
  notificationsEnabled?: boolean;
}

export interface ThreadSearchRequest {
  query?: string;
  creator?: number;
  participant?: number;
  privateOnly?: boolean;
  includeArchived?: boolean;
  relatedObjectType?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface MessageSearchRequest {
  query?: string;
  thread?: number;
  sender?: number;
  messageType?: MessageType;
  dateFrom?: string;
  dateTo?: string;
  includeDeleted?: boolean;
}