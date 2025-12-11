// src/app/chat/[partnerId]/page.tsx (Chat Page - Dynamic URL)
import ChatWindow from '@/components/chat/ChatWindow';

interface ChatPageProps {
  params: {
    partnerId: string; // The dynamic segment from the URL
  };
}

const TEMP_CURRENT_USER_ID = "d98b88c0-f5f1-4f5a-aed1-56c8937f2f33";

const fetchPartnerDetails = async (partnerId: string) => {
    // Logic giả lập:
    if (partnerId === "7d8d31c7-a660-41fe-9109-76a98e7bbfcd") {
        return { name: "Alice_Wonder" };
    }
    if (partnerId === "00000000-0000-0000-0000-000000000003") {
        return { name: "Bob_Builder" };
    }
    // Nếu không tìm thấy, trả về ID rút gọn
    return { name: `${partnerId.slice(0, 8)}...` };
};


export default async function ChatPage({ params }: ChatPageProps) {
    const { partnerId } = params;
    if (partnerId === TEMP_CURRENT_USER_ID) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="p-8 bg-white rounded-lg shadow-xl text-center text-yellow-600">
                    <h2 className="text-2xl font-bold mb-3">Self-Chat Disabled</h2>
                    <p>You cannot start a conversation with yourself.</p>
                </div>
            </div>
        );
    }

    // 1. Lấy tên partner trên Server
    const partnerDetails = await fetchPartnerDetails(partnerId);
    
    const currentUserId = TEMP_CURRENT_USER_ID; 

    return (
        <div className="h-screen w-full flex flex-col bg-gray-100">
            
            {/* Header: Partner Name/ID */}
            <header className="p-4 border-b border-gray-200 bg-white shadow-md sticky top-0 z-10">
                <h1 className="text-xl font-bold text-gray-800">
                    Chatting with: <span className="text-indigo-600">{partnerDetails.name}</span>
                </h1>
                <p className="text-sm text-gray-500">Partner ID: {partnerId}</p>
            </header>

            {/* Main Chat Container */}
            <div className="flex-1 overflow-hidden">
                <ChatWindow 
                    currentUserId={currentUserId} 
                    partnerId={partnerId} 
                    partnerName={partnerDetails.name} // TRUYỀN TÊN VÀO ĐÂY
                />
            </div>
        </div>
    );
}