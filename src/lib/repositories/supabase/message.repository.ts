import { SupabaseClient } from "@supabase/supabase-js";
import { IDirectMessageRepository, DirectMessage, CreateMessageDTO, Conversation } from "../../types/message.type";

export class SupabaseDirectMessageRepository implements IDirectMessageRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: CreateMessageDTO): Promise<DirectMessage> {
    const { data: message, error } = await this.supabase
      .from("DirectMessage")
      .insert({
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        content: data.content,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create direct message: ${error.message}`);
    }
    return message as DirectMessage;
  }

  async getConversationHistory(
    userAId: string, 
    userBId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<DirectMessage[]> {
    
    const condition = 
        `and(sender_id.eq.${userAId},receiver_id.eq.${userBId}),` +
        `and(sender_id.eq.${userBId},receiver_id.eq.${userAId})`;
    // Sử dụng OR để kết hợp cả hai chiều trò chuyện (A -> B và B -> A)
    const { data: messages, error } = await this.supabase
      .from("DirectMessage")
      .select("*")
      .or(condition)
      .order("created_at", { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1); // Sử dụng range/offset cho pagination

    if (error) {
      throw new Error(`Failed to fetch conversation history: ${error.message}`);
    }

    return (messages as DirectMessage[]).reverse(); 
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    // Lấy tất cả tin nhắn mà user tham gia (gửi hoặc nhận)
    const { data: messages, error } = await this.supabase
      .from("DirectMessage")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    if (!messages || messages.length === 0) {
      return [];
    }

    // Group messages by conversation partner
    const conversationMap = new Map<string, {
      lastMessage: DirectMessage;
      messages: DirectMessage[];
    }>();

    for (const message of messages as DirectMessage[]) {
      const partnerId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          lastMessage: message,
          messages: [message]
        });
      } else {
        conversationMap.get(partnerId)!.messages.push(message);
      }
    }

    // Lấy thông tin user cho mỗi partner
    const partnerIds = Array.from(conversationMap.keys());
    const { data: users, error: usersError } = await this.supabase
      .from("UserAccount")
      .select("id, username")
      .in("id", partnerIds);

    if (usersError) {
      console.error("Failed to fetch user details:", usersError);
    }

    const userMap = new Map(
      (users || []).map((u: any) => [u.id, u.username || `User_${u.id.slice(0, 8)}`])
    );

    // Convert to Conversation array
    const conversations: Conversation[] = Array.from(conversationMap.entries()).map(
      ([partnerId, data]) => ({
        partnerId,
        partnerName: userMap.get(partnerId) || `User_${partnerId.slice(0, 8)}`,
        lastMessage: data.lastMessage.content,
        lastMessageTime: data.lastMessage.created_at,
        unreadCount: 0, // TODO: Implement unread count logic
      })
    );

    // Sort by last message time (most recent first)
    conversations.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );

    return conversations;
  }
}