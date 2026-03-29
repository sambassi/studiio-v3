'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';

export function Navbar() {
  const { data: session } = useSession();
  const { toggleSidebar } = useSidebar();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <nav className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-gray-900 border-b border-gray-800 z-40">
      <div className="h-full px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Mobile hamburger menu */}
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-400 hover:text-white transition"
            title="Menu"
          >
            <Menu size={24} />
          </button>
          <div className="text-gray-400 hidden md:block">
            {session?.user?.name ? `Bonjour, ${session.user.name.split(' ')[0]}` : 'Dashboard'}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-gray-400 hover:text-white transition relative"
              title="Notifications"
            >
              <Bell size={20} />
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 z-50">
                <div className="text-sm text-gray-400">Aucune notification</div>
              </div>
            )}
          </div>
          {/* User profile */}
          <Link
            href="/dashboard/billing"
            className="text-gray-400 hover:text-white transition"
            title="Profil"
          >
            <User size={20} />
          </Link>
          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="text-gray-400 hover:text-red-400 transition"
            title="Déconnexion"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
