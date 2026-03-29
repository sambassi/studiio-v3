'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Instagram, Music, Facebook, Youtube, Check, Loader2, ExternalLink, Calendar, Share2, AlertCircle } from 'lucide-react';

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  account_id: string;
  connected: boolean;
  created_at: string;
}

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-400', description: 'Reels, Stories, Posts' },
  { id: 'tiktok', name: 'TikTok', icon: Music, color: 'text-cyan-400', description: 'Vidéos courtes virales' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-400', description: 'Vidéos, Reels, Stories' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-400', description: 'Shorts, vidéos longues' },
];

export default function SocialPage() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/social/accounts');
        const data = await res.json();
        if (data.success) {
          setAccounts(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching social accounts:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  const getAccountForPlatform = (platformId: string) => {
    return accounts.find(a => a.platform === platformId && a.connected);
  };

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    // In production: redirect to OAuth flow for the platform
    // For now, show coming soon behavior
    setTimeout(() => {
      setConnecting(null);
    }, 2000);
  };

  const connectedCount = PLATFORMS.filter(p => getAccountForPlatform(p.id)).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Réseaux sociaux</h1>
        <p className="text-gray-400">
          Connectez vos comptes pour publier vos vidéos automatiquement
        </p>
      </div>

      {/* Connection status */}
      <Card className="border-studiio-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-studiio-primary/10 rounded-full flex items-center justify-center">
              <Share2 className="text-studiio-primary" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold">
                {connectedCount > 0
                  ? `${connectedCount} réseau${connectedCount > 1 ? 'x' : ''} connecté${connectedCount > 1 ? 's' : ''}`
                  : 'Aucun réseau connecté'}
              </p>
              <p className="text-sm text-gray-400">
                {connectedCount > 0
                  ? 'Vos vidéos peuvent être publiées automatiquement'
                  : 'Connectez au moins un réseau pour publier vos vidéos'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          const account = getAccountForPlatform(platform.id);
          const isConnecting = connecting === platform.id;

          return (
            <Card key={platform.id} className={account ? 'border-green-500/30' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      account ? 'bg-green-500/10' : 'bg-gray-800'
                    }`}>
                      <Icon size={24} className={account ? platform.color : 'text-gray-500'} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{platform.name}</h3>
                      {account ? (
                        <p className="text-sm text-green-400">@{account.account_name}</p>
                      ) : (
                        <p className="text-sm text-gray-500">{platform.description}</p>
                      )}
                    </div>
                  </div>
                  {account && (
                    <Badge variant="success">
                      <Check size={12} className="mr-1" /> Connecté
                    </Badge>
                  )}
                </div>

                <Button
                  variant={account ? 'ghost' : 'primary'}
                  className="w-full"
                  disabled={isConnecting}
                  onClick={() => handleConnect(platform.id)}
                >
                  {isConnecting ? (
                    <><Loader2 size={16} className="animate-spin mr-2 inline" /> Connexion...</>
                  ) : account ? (
                    <>Reconnecter</>
                  ) : (
                    <>Connecter {platform.name}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Publishing Settings */}
      <Card>
        <CardHeader className="border-b border-gray-800">
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} /> Paramètres de publication
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl cursor-pointer hover:bg-gray-800 transition">
              <input type="checkbox" className="w-4 h-4 accent-studiio-primary" defaultChecked />
              <div>
                <p className="font-medium text-white text-sm">Publication multi-réseaux</p>
                <p className="text-xs text-gray-400">Publiez automatiquement sur tous vos comptes connectés</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl cursor-pointer hover:bg-gray-800 transition">
              <input type="checkbox" className="w-4 h-4 accent-studiio-primary" />
              <div>
                <p className="font-medium text-white text-sm">Programmation intelligente</p>
                <p className="text-xs text-gray-400">L&apos;IA choisit l&apos;heure optimale de publication</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl cursor-pointer hover:bg-gray-800 transition">
              <input type="checkbox" className="w-4 h-4 accent-studiio-primary" defaultChecked />
              <div>
                <p className="font-medium text-white text-sm">Légendes IA</p>
                <p className="text-xs text-gray-400">Générez des légendes et hashtags adaptés à chaque plateforme</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Info banner */}
      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-500 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <p className="text-white font-semibold text-sm">Publication en cours de développement</p>
              <p className="text-xs text-gray-400 mt-1">
                La publication automatique sera bientôt disponible. Vous pourrez publier directement vos vidéos
                sur Instagram, TikTok, Facebook et YouTube depuis Studiio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
