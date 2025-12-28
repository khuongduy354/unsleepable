// src/app/chat/[partnerId]/page.tsx (Chat Page - Dynamic URL)
import { use } from 'react';
import ChatLayout from '@/components/chat/ChatLayout';
import AppLayout from '@/components/AppLayout';

export default function ChatPage({ params }: { params: Promise<{ partnerId: string }> }) {
    const { partnerId } = use(params);

    return (
        <AppLayout>
            <div className="h-full w-full">
                <ChatLayout partnerId={partnerId} />
            </div>
        </AppLayout>
    );
}