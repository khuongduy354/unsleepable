import { SupabaseClient } from "@supabase/supabase-js";
import { IDirectMessageRepository, DirectMessage, CreateMessageDTO } from "../../types/message.type";

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
}