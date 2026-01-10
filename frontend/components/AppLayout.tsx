'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-neutral-900">
      <Sidebar />
      <main className="flex-1 w-full min-w-0">
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-4 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
