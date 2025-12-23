// src/components/chat/MessageInput.tsx
"use client";

import React, { useState } from "react";
import { messageApi } from "@/lib/api";

interface MessageInputProps {
  currentUserId: string;
  partnerId: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  currentUserId,
  partnerId,
}) => {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent || isSending) return;

    setIsSending(true);

    try {
      await messageApi.send({
        senderId: currentUserId,
        receiverId: partnerId,
        content: trimmedContent,
      });

      setContent("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Could not send message. Check console for details.");
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
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg"
        }`}
      >
        {/* Biểu tượng mũi tên gửi (Send Icon) */}
        {isSending ? (
          <svg
            className="w-5 h-5 animate-spin text-white"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <svg
            className="w-[32px] h-[32px] text-gray-800 dark:text-white"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 16.881V7.119a1 1 0 0 1 1.636-.772l5.927 4.881a1 1 0 0 1 0 1.544l-5.927 4.88A1 1 0 0 1 8 16.882Z"
            />
          </svg>
        )}
      </button>
    </form>
  );
};

export default MessageInput;
