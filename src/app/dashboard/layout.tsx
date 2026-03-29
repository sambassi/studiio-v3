'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { SidebarProvider } from '@/contexts/SidebarContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-studiio-dark">
        <Sidebar />
        <Navbar />
        <main className="mt-16 md:ml-64 p-4 md:p-8 min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
