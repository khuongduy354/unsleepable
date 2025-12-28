// src/components/chat/ChatWindow.tsx (Updated Realtime Listener)
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import MessageInput from "./MessageInput";
import { messageApi } from "@/lib/api";
// Import các types/client cần thiết cho Realtime
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

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
  onNewMessage?: (message: DirectMessage) => void; // Callback để update ConversationList
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  currentUserId,
  partnerId,
  partnerName,
  onNewMessage,
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseClientRef = useRef(createClient());

  const partnerInitial = partnerName[0]?.toUpperCase() || "P";

  // Hàm cuộn xuống cuối
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto scroll khi messages thay đổi
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, loading, scrollToBottom]);

  // Logic tải lịch sử
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const history = await messageApi.getHistory(partnerId);
        setMessages(history);
      } catch (error) {
        console.error("Error fetching chat history:", error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [partnerId]);

  // Logic Realtime với xử lý kết nối tốt hơn
  useEffect(() => {
    if (loading) return;

    const supabaseClient = supabaseClientRef.current;
    const channelName = `dm:${currentUserId}:${partnerId}`;
    
    // Cleanup channel cũ nếu có
    if (channelRef.current) {
      supabaseClient.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Tạo channel mới
    const channel = supabaseClient.channel(channelName);
    channelRef.current = channel;

    // Subscribe với xử lý trạng thái
    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "DirectMessage",
        },
        (payload) => {
          const newMessage = payload.new as DirectMessage;
          
          // Kiểm tra tin nhắn có liên quan đến cuộc hội thoại này không
          const isRelated =
            (newMessage.sender_id === currentUserId && newMessage.receiver_id === partnerId) ||
            (newMessage.sender_id === partnerId && newMessage.receiver_id === currentUserId);

          if (isRelated) {
            // Kiểm tra duplicate trước khi thêm
            setMessages((prevMessages) => {
              const isDuplicate = prevMessages.some(msg => msg.id === newMessage.id);
              if (isDuplicate) return prevMessages;
              
              return [...prevMessages, newMessage];
            });
            
            // Callback để update ConversationList (chỉ 1 setTimeout duy nhất)
            if (onNewMessage) {
              setTimeout(() => onNewMessage(newMessage), 0);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status: ${status}`);
        
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          setConnectionStatus('connected');
        } else if (status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR || 
                   status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT) {
          setConnectionStatus('disconnected');
        } else {
          setConnectionStatus('connecting');
        }
      });

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUserId, partnerId, loading, onNewMessage]);

  // --- UI HIỂN THỊ ---

  return (
    <div className="flex flex-col h-full">
      {/* 1. Header với connection status */}
      <div className="p-3 border-b border-gray-200 bg-white shadow-sm flex items-center space-x-3 sticky top-0 z-10">
        {/* Avatar */}
        <div className="h-10 w-10 min-w-10 bg-indigo-100 rounded-full flex items-center justify-center text-lg font-bold text-indigo-700">
          {partnerInitial}
        </div>

        {/* Tên và trạng thái */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{partnerName}</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
              'bg-red-500'
            }`}></div>
            <p className="text-xs text-gray-500">
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'connecting' ? 'Connecting...' : 
               'Disconnected'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Khu vực hiển thị tin nhắn */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-100">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading messages...</p>
            </div>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg">Start a new conversation with {partnerName}</p>
            <p className="text-sm text-gray-400 mt-1">Send a message to begin chatting</p>
          </div>
        )}

        {!loading && messages.map((msg) => {
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
                <p className="text-sm break-words">{msg.content}</p>
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

      {/* 3. Message Input */}
      <div className="p-4 border-t bg-white sticky bottom-0">
        <MessageInput 
          currentUserId={currentUserId} 
          partnerId={partnerId}
        />
      </div>
    </div>
  );
}

export default ChatWindow;
