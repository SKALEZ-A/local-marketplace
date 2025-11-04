export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, any>;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  participants: string[];
  type: 'direct' | 'group' | 'support';
  name?: string;
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatModel {
  private chats: Map<string, Chat> = new Map();
  private messages: Map<string, Message> = new Map();

  async findChatById(id: string): Promise<Chat | null> {
    return this.chats.get(id) || null;
  }

  async findUserChats(userId: string): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter(c => c.participants.includes(userId));
  }

  async createChat(chatData: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>): Promise<Chat> {
    const id = this.generateId();
    const chat: Chat = {
      id,
      ...chatData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.chats.set(id, chat);
    return chat;
  }

  async findMessageById(id: string): Promise<Message | null> {
    return this.messages.get(id) || null;
  }

  async findChatMessages(chatId: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(m => m.chatId === chatId);
  }

  async createMessage(messageData: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    const id = this.generateId();
    const message: Message = {
      id,
      ...messageData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
