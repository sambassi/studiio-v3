'use client';

import { useEffect, useState } from 'react';
import { CreditsDisplay } from '@/components/billing/CreditsDisplay';
import { PricingCards } from '@/components/billing/PricingCards';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CREDIT_PACKAGES, STRIPE_PLANS } from '@/lib/stripe/constants';

interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

interface CreditsData {
  credits: number;
  transactions?: Array<{
    id: string;
    date: string;
    description: string;
    credits: number;
    balance: number;
  }>;
}

export default function BillingPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [creditsData, setCreditsData] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user profile
        const profileRes = await fetch('/api/user/profile');
        const profileJson = await profileRes.json();
        if (profileJson.success && profileJson.data) {
          setUserProfile(profileJson.data);
        }

        // Fetch credits balance
        const creditsRes = await fetch('/api/credits/balance');
        const creditsJson = await creditsRes.json();
        if (creditsJson.success && creditsJson.data) {
          setCreditsData(creditsJson.data);
        } else {
          setCreditsData({ credits: profileJson.data?.credits || 0, transactions: [] });
        }
      } catch (err) {
        console.error('Error fetching billing data:', err);
        setError('Impossible de charger les données de facturation');
        // Set default values on error
        setUserProfile({ id: '', email: '', role: 'user' });
        setCreditsData({ credits: 0, transactions: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCreditPurchase = (pkgName: string) => {
    showToast('Paiement Stripe bientôt disponible');
  };

  const handleManageSubscription = () => {
    showToast('Paiement Stripe bientôt disponible');
  };

  const handleSelectPlan = (plan: string) => {
    showToast('Paiement Stripe bientôt disponible');
  };

  const transactions = creditsData?.transactions || [];
  const hasNoTransactions = transactions.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Facturation</h1>
        <p className="text-gray-400">Gérez vos crédits et votre abonnement</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <CreditsDisplay
        credits={creditsData?.credits || 0}
        plan={userProfile?.role}
        loading={loading}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="border-b border-gray-800">
            <CardTitle>Abonnement actuel</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="w-20 h-6 bg-gray-700 rounded" />
                <div className="w-16 h-8 bg-gray-700 rounded" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Plan</p>
                    <p className="text-2xl font-bold text-white">
                      {userProfile?.role === 'admin' ? 'Admin' : 'Utilisateur'}
                    </p>
                  </div>
                  <Badge variant="success">Actif</Badge>
                </div>
                <div className="pt-4 border-t border-gray-800">
                  <p className="text-sm text-gray-400 mb-1">Renouvellement</p>
                  <p className="text-white font-semibold">Non configuré</p>
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleManageSubscription}
                >
                  Gérer l'abonnement
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-gray-800">
            <CardTitle>Acheter des crédits</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-full h-10 bg-gray-700 rounded" />
                ))}
              </div>
            ) : (
              Object.entries(CREDIT_PACKAGES).map(([key, pkg]) => (
                <Button
                  key={key}
                  variant="secondary"
                  className="w-full"
                  onClick={() => handleCreditPurchase(pkg.name)}
                >
                  {pkg.name} - {pkg.priceFr}
                </Button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-800">
          <CardTitle>Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full h-10 bg-gray-700 rounded" />
              ))}
            </div>
          ) : hasNoTransactions ? (
            <p className="text-gray-400 text-center py-8">Aucune transaction</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2 text-gray-400 font-medium">Date</th>
                    <th className="text-left py-2 text-gray-400 font-medium">Description</th>
                    <th className="text-right py-2 text-gray-400 font-medium">Crédits</th>
                    <th className="text-right py-2 text-gray-400 font-medium">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-gray-800 last:border-0">
                      <td className="py-3 text-gray-300">{tx.date}</td>
                      <td className="py-3 text-gray-300">{tx.description}</td>
                      <td className={`text-right py-3 font-semibold ${tx.credits > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.credits > 0 ? '+' : ''}{tx.credits}
                      </td>
                      <td className="text-right py-3 text-white">{tx.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Modifier votre plan</h2>
        <PricingCards onSelectPlan={handleSelectPlan} />
      </div>

      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-gray-800 border border-gray-700 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
