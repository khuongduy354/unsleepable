// src/components/chat/ChatLayout.tsx (Updated with Real Data)
"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ChatWindow from './ChatWindow';
import ConversationList from './ConversationList';
import { messageApi } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';

interface User {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
}

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

const ChatLayout: React.FC = () => {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [selectedPartnerName, setSelectedPartnerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        // Redirect to login if not authenticated
        router.push('/auth/login');
        return;
      }
      
      setCurrentUserId(session.user.id);
    };
    
    checkAuth();
  }, [router]);

  // Fetch conversations from database
  useEffect(() => {
    // Don't fetch if user is not authenticated yet
    if (!currentUserId) return;
    
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        const conversations = await messageApi.getConversations();
        
        // Convert to User format
        const userList: User[] = conversations.map(conv => ({
          id: conv.partnerId,
          name: conv.partnerName,
          lastMessage: conv.lastMessage,
          time: getTimeAgo(new Date(conv.lastMessageTime)),
          unreadCount: conv.unreadCount,
        }));
        
        setUsers(userList);
        
        // Auto-select first conversation if available
        if (userList.length > 0 && !selectedPartnerId) {
          setSelectedPartnerId(userList[0].id);
          setSelectedPartnerName(userList[0].name);
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [selectedPartnerId, currentUserId]);

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const handleSelectPartner = useCallback((partnerId: string, partnerName: string) => {
    setSelectedPartnerId(partnerId);
    setSelectedPartnerName(partnerName);
    
    // Reset unread count when selecting a conversation
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === partnerId ? { ...user, unreadCount: 0 } : user
      )
    );
  }, []);

  // Handle new message from realtime subscription
  const handleNewMessage = useCallback((message: DirectMessage) => {
    if (!currentUserId) return;
    
    const partnerId = message.sender_id === currentUserId 
      ? message.receiver_id 
      : message.sender_id;
    
    handleUpdateConversation(partnerId, message.content, 'Just now');
  }, [currentUserId]);

  // Update conversation list when new message arrives
  const handleUpdateConversation = useCallback((partnerId: string, lastMessage: string, time: string) => {
    setUsers(prevUsers => {
      const userIndex = prevUsers.findIndex(u => u.id === partnerId);
      
      if (userIndex !== -1) {
        const updatedUsers = [...prevUsers];
        const user = updatedUsers[userIndex];
        
        // Update last message and time
        user.lastMessage = lastMessage;
        user.time = time;
        
        // Increment unread count if this is not the currently selected conversation
        if (partnerId !== selectedPartnerId) {
          user.unreadCount += 1;
        }
        
        // Move conversation to top
        updatedUsers.splice(userIndex, 1);
        updatedUsers.unshift(user);
        
        return updatedUsers;
      }
      
      // If conversation doesn't exist, we might need to fetch conversations again
      // For now, just return the current list
      return prevUsers;
    });
  }, [selectedPartnerId]);

  return (
    <div className="flex h-full antialiased">
      
      {/* Show loading if user not authenticated yet */}
      {!currentUserId ? (
        <div className="flex items-center justify-center h-full w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking authentication...</p>
          </div>
        </div>
      ) : (
        <>
      {/* 1. Sidebar - Conversation List */}
      <div className="w-80 min-w-[320px] bg-card border-r flex flex-col">
        <header className="p-4 border-b sticky top-0 bg-card z-10">
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-xs text-muted-foreground">User ID: {currentUserId.slice(0, 8)}...</p>
        </header>
        
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading conversations...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center text-destructive">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-sm text-primary hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <ConversationList
            users={users}
            selectedPartnerId={selectedPartnerId}
            currentUserId={currentUserId}
            onSelectPartner={handleSelectPartner}
            onUpdateConversation={handleUpdateConversation}
          />
        )}
      </div>
      
      {/* 2. Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedPartnerId && !loading ? (
            <ChatWindow
              currentUserId={currentUserId} 
              partnerId={selectedPartnerId} 
              partnerName={selectedPartnerName || "Contact"}
              onNewMessage={handleNewMessage}
            />
        ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground bg-background">
              <div className="text-center">
                <svg className="w-24 h-24 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-lg">
                  {loading ? "Loading..." : "Select a contact to start chatting"}
                </span>
              </div>
            </div>
        )}
      </div>
      </>
      )}
      
    </div>
  );
};

export default ChatLayout;