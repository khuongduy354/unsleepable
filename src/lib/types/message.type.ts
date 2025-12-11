export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export interface CreateMessageDTO {
  sender_id: string;
  receiver_id: string;
  content: string;
}

export interface IDirectMessageRepository {
  create(data: CreateMessageDTO): Promise<DirectMessage>;
  getConversationHistory(userAId: string, userBId: string, limit: number, offset: number): Promise<DirectMessage[]>;
}

export interface IMessageService {
  sendMessage(data: CreateMessageDTO): Promise<DirectMessage>;
  getHistory(userAId: string, userBId: string, limit?: number, offset?: number): Promise<DirectMessage[]>;
}