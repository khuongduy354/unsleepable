// src/app/chat/[partnerId]/page.tsx (Chat Page - Dynamic URL)
import ChatLayout from '@/components/chat/ChatLayout';
import AppLayout from '@/components/AppLayout';

export default function ChatPage({ params }: { params: { partnerId: string } }) {
    const { partnerId } = params;

    return (
        <AppLayout>
            <div className="h-full w-full">
                <ChatLayout partnerId={partnerId} />
            </div>
        </AppLayout>
    );
}