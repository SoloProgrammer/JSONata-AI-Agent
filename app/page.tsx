'use client';

import { ChatInterface } from '@/components/chat-interface';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-black">
      <ChatInterface />
    </main>
  );
}