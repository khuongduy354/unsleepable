// src/components/chat/ConversationList.tsx
"use client";

import React, { useEffect, useRef } from 'react';
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

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

interface ConversationListProps {
    users: User[];
    selectedPartnerId: string | null;
    currentUserId: string;
    onSelectPartner: (partnerId: string, partnerName: string) => void;
    onUpdateConversation?: (partnerId: string, lastMessage: string, time: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
    users, 
    selectedPartnerId, 
    currentUserId,
    onSelectPartner,
    onUpdateConversation 
}) => {
    const channelRef = useRef<RealtimeChannel | null>(null);
    const supabaseClientRef = useRef(createClient());

    // Subscribe to all messages for this user
    useEffect(() => {
        const supabaseClient = supabaseClientRef.current;
        const channelName = `conversations:${currentUserId}`;
        
        // Cleanup old channel
        if (channelRef.current) {
            supabaseClient.removeChannel(channelRef.current);
        }

        // Create new channel
        const channel = supabaseClient.channel(channelName);
        channelRef.current = channel;

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
                    
                    // Check if this message involves the current user
                    const isIncoming = newMessage.receiver_id === currentUserId;
                    const isOutgoing = newMessage.sender_id === currentUserId;
                    
                    if (isIncoming || isOutgoing) {
                        const partnerId = isIncoming ? newMessage.sender_id : newMessage.receiver_id;
                        const timeAgo = getTimeAgo(new Date(newMessage.created_at));
                        
                        // Update conversation list
                        if (onUpdateConversation) {
                            onUpdateConversation(partnerId, newMessage.content, timeAgo);
                        }
                    }
                }
            )
            .subscribe();

        // Cleanup
        return () => {
            if (channelRef.current) {
                supabaseClient.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [currentUserId, onUpdateConversation]);

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

    return (
        <div className="flex-1 overflow-y-auto">
            {users.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-gray-400">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                    <p className="text-center">No conversations yet</p>
                    <p className="text-sm text-center mt-1">Start a new chat to begin</p>
                </div>
            ) : (
                users.map((user) => {
                    const isSelected = selectedPartnerId === user.id;
                    const initial = user.name[0]?.toUpperCase() || 'A';
                    
                    return (
                        <button
                            key={user.id}
                            onClick={() => onSelectPartner(user.id, user.name)}
                            className={`w-full p-3 flex space-x-3 transition duration-150 border-b ${
                                isSelected 
                                    ? 'bg-indigo-50 border-l-4 border-indigo-600' 
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            {/* Avatar */}
                            <div className="h-10 w-10 min-w-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-md font-bold text-white shadow-md">
                                {initial}
                            </div>
                            
                            {/* Nội dung */}
                            <div className="flex-1 text-left min-w-0">
                                <div className="flex justify-between items-center">
                                    <div className={`font-semibold text-sm truncate ${isSelected ? 'text-indigo-800' : 'text-gray-800'}`}>
                                        {user.name}
                                    </div>
                                    <div className="text-xs text-gray-500 ml-2">{user.time}</div>
                                </div>
                                <div className="flex justify-between items-center mt-0.5">
                                    <div className={`text-sm truncate ${user.unreadCount > 0 ? 'font-medium text-gray-700' : 'text-gray-500'}`}>
                                        {user.lastMessage}
                                    </div>
                                    {user.unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2 min-w-[20px] text-center">
                                            {user.unreadCount > 99 ? '99+' : user.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })
            )}
        </div>
    );
};

export default ConversationList;
