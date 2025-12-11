// src/components/chat/MessageInput.tsx
"use client";

import React, { useState } from 'react';

interface MessageInputProps {
  currentUserId: string;
  partnerId: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ currentUserId, partnerId }) => {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || isSending) return;

    setIsSending(true);

    try {
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: partnerId,
          content: trimmedContent,
        }),
      });

      if (!response.ok) {
        // Log lỗi chi tiết từ server nếu có
        const errorData = await response.json();
        console.error('API Error:', errorData.details || errorData.error);
        throw new Error('Failed to send message via API.');
      }

      setContent(''); // Xóa nội dung input sau khi gửi
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Could not send message. Check console for details.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="flex space-x-3 items-center">
      {/* Input Field */}
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
        disabled={isSending}
        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 transition duration-150"
      />
      
      {/* Send Button (Styled like the sample image) */}
      <button
        type="submit"
        disabled={isSending || !content.trim()}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition duration-200 ${
          isSending || !content.trim() 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'
        }`}
      >
        {/* Biểu tượng mũi tên gửi (Send Icon) */}
        {isSending ? (
            <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        ) : (
            // Icon mũi tên (Arrow)
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white transform rotate-45 -mt-1 ml-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0110.887 5.006zM18 12L21.037 3.328A59.768 59.768 0 0110.887 5.006zM9.53 17.653A27.574 27.574 0 015 12c0-1.874.225-3.725.669-5.467L12 12M18 12L9.53 17.653M18 12L9.53 17.653" />
            </svg>
        )}
      </button>
    </form>
  );
};

export default MessageInput;