import ChatLayout from '@/components/chat/ChatLayout';
import AppLayout from '@/components/AppLayout';

export default function ChatPage() {
    return (
        <AppLayout>
            <div className="h-full w-full">
                <ChatLayout />
            </div>
        </AppLayout>
    );
}