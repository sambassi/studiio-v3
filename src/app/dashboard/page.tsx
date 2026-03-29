'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { CreditsDisplay } from '@/components/billing/CreditsDisplay';
import { RecentVideos } from '@/components/dashboard/RecentVideos';
import { Video, Film, Zap, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface DashboardStats {
  totalVideos: number;
  credits: number;
  totalPublications: number;
  totalViews: number;
  role: string;
  userName: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    credits: 0,
    totalPublications: 0,
    totalViews: 0,
    role: 'user',
    userName: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch user profile and credits in parallel
        const [profileRes, creditsRes, videosRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/credits/balance'),
          fetch('/api/videos?limit=1'),
        ]);

        const profileData = await profileRes.json();
        const creditsData = await creditsRes.json();
        const videosData = await videosRes.json();

        setStats({
          totalVideos: videosData.data?.total || 0,
          credits: creditsData.data?.credits || 0,
          totalPublications: 0,
          totalViews: 0,
          role: profileData.data?.role || 'user',
          userName: profileData.data?.name || session?.user?.name || 'Utilisateur',
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  const firstName = stats.userName.split(' ')[0] || 'Utilisateur';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">
          {loading ? 'Chargement...' : `Bienvenue, ${firstName} 👋`}
        </h1>
        <p className="text-gray-400">
          {stats.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
          {' • '}{stats.credits} crédits disponibles
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <StatsCard
          icon={Video}
          label="Vidéos créées"
          value={loading ? '...' : stats.totalVideos}
        />
        <StatsCard
          icon={Zap}
          label="Crédits restants"
          value={loading ? '...' : stats.credits.toLocaleString()}
        />
        <StatsCard
          icon={Film}
          label="Publications"
          value={loading ? '...' : stats.totalPublications}
        />
        <StatsCard
          icon={Eye}
          label="Vues totales"
          value={loading ? '...' : stats.totalViews.toLocaleString()}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <RecentVideos />
        </div>
        <div className="space-y-6">
          <CreditsDisplay credits={stats.credits} plan={stats.role} loading={loading} />
          <div className="card-base p-6 space-y-4">
            <h3 className="font-bold text-white">Actions rapides</h3>
            <Link href="/dashboard/creator" className="block">
              <Button variant="primary" size="lg" className="w-full">
                Créer une vidéo
              </Button>
            </Link>
            <Link href="/dashboard/social" className="block">
              <Button variant="secondary" size="lg" className="w-full">
                Connecter réseaux sociaux
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
