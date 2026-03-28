'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Lien de réinitialisation invalide ou expiré.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Une erreur est survenue');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-studiio-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card-base p-8 space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Lock size={28} className="text-studiio-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Nouveau mot de passe</h1>
            <p className="text-gray-400">
              Choisissez un nouveau mot de passe pour votre compte.
            </p>
          </div>

          {success ? (
            <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-4 rounded-lg text-sm text-center space-y-2">
              <p className="font-semibold">Mot de passe modifié !</p>
              <p>Votre mot de passe a été réinitialisé avec succès.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {token && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nouveau mot de passe</label>
                    <input
                      type="password"
                      className="input-base w-full"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      className="input-base w-full"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full button-primary disabled:opacity-50"
                  >
                    {loading ? 'Modification...' : 'Réinitialiser le mot de passe'}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="text-center">
            <Link href="/auth/login" className="text-studiio-primary hover:text-purple-400 font-semibold text-sm">
              ← Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-studiio-dark flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
