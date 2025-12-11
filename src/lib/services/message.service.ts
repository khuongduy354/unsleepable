import { 
    IMessageService, 
    IDirectMessageRepository, 
    DirectMessage, 
    CreateMessageDTO 
} from "../types/message.type";

export class MessageService implements IMessageService {
    
    constructor(private messageRepository: IDirectMessageRepository) {}
    async sendMessage(data: CreateMessageDTO): Promise<DirectMessage> {
        if (!data.content || data.content.trim().length === 0) {
            throw new Error("Message content cannot be empty.");
        }
        
        const savedMessage = await this.messageRepository.create(data);

        //    - Logic nghiệp vụ sau khi lưu:
        //    - Có thể gửi notification push, email, v.v.
        
        return savedMessage;
    }

    async getHistory(
        userAId: string, 
        userBId: string, 
        limit: number = 50, 
        offset: number = 0 
    ): Promise<DirectMessage[]> {
        
        if (userAId === userBId) {
            throw new Error("Cannot retrieve chat history for the same user.");
        }
        const history = await this.messageRepository.getConversationHistory(
            userAId, 
            userBId, 
            limit, 
            offset
        );
        return history;
    }
}