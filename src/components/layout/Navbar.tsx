'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Bell, User, LogOut } from 'lucide-react';

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 right-0 left-64 h-16 bg-gray-900 border-b border-gray-800 z-40">
      <div className="h-full px-6 flex justify-between items-center">
        <div className="text-gray-400">
          {session?.user?.name ? `Bonjour, ${session.user.name.split(' ')[0]}` : 'Dashboard'}
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-white transition relative">
            <Bell size={20} />
          </button>
          <Link href="/dashboard/billing" className="text-gray-400 hover:text-white transition">
            <User size={20} />
          </Link>
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
