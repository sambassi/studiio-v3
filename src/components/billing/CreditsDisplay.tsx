import { Card, CardContent } from '@/components/ui/Card';
import { Zap } from 'lucide-react';
import Link from 'next/link';

interface CreditsDisplayProps {
  credits: number;
  plan?: string;
  loading?: boolean;
}

export function CreditsDisplay({ credits, plan, loading }: CreditsDisplayProps) {
  const planLabel = plan === 'admin' ? 'Admin' : 'Utilisateur';

  return (
    <Card className="border-studiio-accent/30">
      <CardContent>
        {loading ? (
          <div className="animate-pulse">
            <div className="w-24 h-4 bg-gray-700 rounded mb-3" />
            <div className="w-16 h-10 bg-gray-700 rounded mb-3" />
            <div className="w-32 h-3 bg-gray-700 rounded" />
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Crédits disponibles</p>
              <p className="text-4xl font-bold text-studiio-accent">{credits.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-2">Plan {planLabel}</p>
              {credits < 20 && (
                <Link href="/dashboard/billing" className="text-xs text-studiio-primary hover:text-purple-400 mt-1 block">
                  Recharger vos crédits →
                </Link>
              )}
            </div>
            <Zap className="text-studiio-accent" size={48} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
