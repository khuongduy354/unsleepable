// src/components/chat/ChatWindow.tsx (Updated Realtime Listener)
"use client";

import React, { useEffect, useRef, useState } from "react";
import MessageInput from "./MessageInput";
import { messageApi } from "@/lib/api";
// Import các types/client cần thiết cho Realtime
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

// Định nghĩa kiểu dữ liệu cho tin nhắn (cần khớp với MessageInput)
interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface ChatWindowProps {
  currentUserId: string;
  partnerId: string;
  partnerName: string; // Tên Partner để hiển thị đẹp hơn
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  currentUserId,
  partnerId,
  partnerName,
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref cho cuộn tự động

  const partnerInitial = partnerName[0]?.toUpperCase() || "P";
  // --- LOGIC REALTIME/HISTORY (Tương tự RealtimeListener) ---

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Logic tải lịch sử
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const history = await messageApi.getHistory(partnerId);
        setMessages(history);
      } catch (error) {
        console.error("Error fetching chat history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [partnerId]);

  // Logic Realtime và Cleanup
  useEffect(() => {
    let realtimeChannel: RealtimeChannel;

    const supabaseClient = createClient();

    if (!loading) {
      // Chỉ subscribe sau khi tải lịch sử xong
      const channelName = `dm:${currentUserId}:${partnerId}`;
      realtimeChannel = supabaseClient.channel(channelName);

      realtimeChannel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "DirectMessage",
          },
          (payload) => {
            const newMessage = payload.new as DirectMessage;
            const isRelated =
              (newMessage.sender_id === currentUserId &&
                newMessage.receiver_id === partnerId) ||
              (newMessage.sender_id === partnerId &&
                newMessage.receiver_id === currentUserId);

            if (isRelated) {
              setMessages((prevMessages) => [...prevMessages, newMessage]);
              // Tự động cuộn xuống khi nhận tin mới
              setTimeout(scrollToBottom, 100);
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
      }
    };
  }, [currentUserId, partnerId, loading]);

  // Cuộn xuống lần đầu khi tải xong và khi có tin nhắn mới
  useEffect(() => {
    if (!loading) {
      scrollToBottom();
    }
  }, [messages, loading]);

  // --- UI HIỂN THỊ ---

  return (
    <div className="flex flex-col h-full">
      {/* 1. Khu vực hiển thị tin nhắn */}
      <div className="p-3 border-b border-gray-200 bg-white shadow-sm flex items-center space-x-3 sticky top-0 z-10">
        {/* Avatar */}
        <div className="h-10 w-10 min-w-10 bg-indigo-100 rounded-full flex items-center justify-center text-lg font-bold text-indigo-700">
          {partnerInitial}
        </div>

        {/* Tên và trạng thái */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{partnerName}</h3>
          <p className="text-xs text-green-500 font-medium">Online</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-100">
        {loading && (
          <div className="text-center text-gray-500">Loading messages...</div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            Start a new conversation with {partnerName}.
          </div>
        )}

        {messages.map((msg) => {
          const isOwnMessage = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${
                isOwnMessage ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-md px-4 py-2 rounded-xl text-white shadow ${
                  isOwnMessage
                    ? "bg-blue-600 rounded-br-none"
                    : "bg-gray-700 rounded-tl-none text-white"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <span
                  className={`text-xs mt-1 block ${
                    isOwnMessage ? "text-blue-200" : "text-gray-300"
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
        {/* Điểm cuối để cuộn */}
        <div ref={messagesEndRef} />
      </div>

      {/* 2. Message Input */}
      <div className="p-4 border-t bg-white sticky bottom-0">
        <MessageInput currentUserId={currentUserId} partnerId={partnerId} />
      </div>
    </div>
  );
};

export default ChatWindow;
