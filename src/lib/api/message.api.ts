// API callers for message endpoints

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const messageApi = {
  // Get message history with a partner
  async getHistory(partnerId: string): Promise<DirectMessage[]> {
    const response = await fetch(`/api/message/history?partnerId=${partnerId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch chat history");
    }

    return await response.json();
  },

  // Send a message
  async send(data: {
    senderId: string;
    receiverId: string;
    content: string;
  }): Promise<DirectMessage> {
    const response = await fetch("/api/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send message");
    }

    return await response.json();
  },

  // Get all conversations for current user
  async getConversations(): Promise<Conversation[]> {
    const response = await fetch("/api/message/conversations");

    if (!response.ok) {
      throw new Error("Failed to fetch conversations");
    }

    return await response.json();
  },
};
