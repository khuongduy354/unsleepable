// src/components/chat/ChatLayout.tsx (Updated)
"use client"
import React, { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow'; // SỬ DỤNG COMPONENT MỚI
import ConversationList from './ConversationList'; // SỬ DỤNG COMPONENT LIST MỚI

// --- Dữ liệu Mẫu (Mock Data) ---
const mockUsers = [
  { id: "7d8d31c7-a660-41fe-9109-76a98e7bbfcd", name: "alice_wonder", lastMessage: "Thanks for the help!", time: "5m ago", unreadCount: 2 },
  { id: "5a92bef0-270a-4e8b-b590-a6cdbf703d7b", name: "bob_builder", lastMessage: "See you tomorrow", time: "1h ago", unreadCount: 0 },
  { id: "8b505775-f2d2-46f9-939b-a2cee13812d1", name: "jane_smith", lastMessage: "Great idea!", time: "1 day ago", unreadCount: 1 },
];

const TEMP_CURRENT_USER_ID = "d98b88c0-f5f1-4f5a-aed1-56c8937f2f33"; 

const ChatLayout: React.FC = () => {
  
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [selectedPartnerName, setSelectedPartnerName] = useState<string | null>(null);

  // Thiết lập người dùng đầu tiên làm mặc định khi load
  useEffect(() => {
    if (mockUsers.length > 0 && !selectedPartnerId) {
        setSelectedPartnerId(mockUsers[0].id);
        setSelectedPartnerName(mockUsers[0].name);
    }
  }, [selectedPartnerId]);

  const handleSelectPartner = (partnerId: string, partnerName: string) => {
    setSelectedPartnerId(partnerId);
    setSelectedPartnerName(partnerName);
  };

  return (
    <div className="flex h-screen max-h-screen antialiased">
      
      {/* 1. Sidebar (25% - giống mẫu) */}
      <div className="w-80 min-w-[320px] bg-white border-r border-gray-200 flex flex-col shadow-lg">
        <header className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
          <p className="text-xs text-gray-500">User ID: {TEMP_CURRENT_USER_ID.slice(0, 8)}...</p>
        </header>
        
        <ConversationList
            users={mockUsers}
            selectedPartnerId={selectedPartnerId}
            onSelectPartner={handleSelectPartner}
        />
      </div>
      
      {/* 2. Chat Window (75%) */}
      <div className="flex-1 flex flex-col">
        {selectedPartnerId ? (
            // Truyền tên partner vào ChatWindow
            <ChatWindow
              currentUserId={TEMP_CURRENT_USER_ID} 
              partnerId={selectedPartnerId} 
              partnerName={selectedPartnerName || "Contact"}
            />
        ) : (
            <div className="flex items-center justify-center h-full text-gray-400 bg-white">
              <span className="text-lg">Select a contact to start chatting.</span>
            </div>
        )}
      </div>
      
    </div>
  );
};

export default ChatLayout;