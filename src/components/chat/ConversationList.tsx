// src/components/chat/ConversationList.tsx
"use client";

import React from 'react';

interface User {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    unreadCount: number;
}

interface ConversationListProps {
    users: User[];
    selectedPartnerId: string | null;
    onSelectPartner: (partnerId: string, partnerName: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ users, selectedPartnerId, onSelectPartner }) => {
    return (
        <div className="flex-1 overflow-y-auto">
            {users.map((user) => {
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
                        <div className="h-10 w-10 min-w-10 bg-gray-300 rounded-full flex items-center justify-center text-md font-bold text-gray-600">
                            {initial}
                        </div>
                        
                        {/* Nội dung */}
                        <div className="flex-1 text-left min-w-0">
                            <div className="flex justify-between items-center">
                                <div className={`font-semibold text-sm truncate ${isSelected ? 'text-indigo-800' : 'text-gray-800'}`}>
                                    {user.name}
                                </div>
                                <div className="text-xs text-gray-500">{user.time}</div>
                            </div>
                            <div className="flex justify-between items-center mt-0.5">
                                <div className="text-sm text-gray-500 truncate">{user.lastMessage}</div>
                                {user.unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                                        {user.unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default ConversationList;