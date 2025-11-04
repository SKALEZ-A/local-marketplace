export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage?: LastMessage;
  unreadCount: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  userId: string;
  role: string;
  joinedAt: Date;
}

export interface LastMessage {
  text: string;
  senderId: string;
  timestamp: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
  content: string;
  metadata?: MessageMetadata;
  status: MessageStatus;
  readAt?: Date;
  createdAt: Date;
}

export type MessageType = 'text' | 'image' | 'product_link';

export interface MessageMetadata {
  productId?: string;
  imageUrl?: string;
}

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface MessageInput {
  conversationId: string;
  receiverId: string;
  type: MessageType;
  content: string;
  metadata?: MessageMetadata;
}

export interface TypingIndicator {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}
