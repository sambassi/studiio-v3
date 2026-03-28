'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
              <Mail size={28} className="text-studiio-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Mot de passe oublié ?</h1>
            <p className="text-gray-400">
              Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          {success ? (
            <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-4 rounded-lg text-sm text-center space-y-2">
              <p className="font-semibold">E-mail envoyé !</p>
              <p>
                Si un compte existe avec cette adresse e-mail, vous recevrez un lien de réinitialisation.
                Vérifiez votre boîte de réception et vos spams.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Adresse e-mail</label>
                  <input
                    type="email"
                    className="input-base w-full"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full button-primary disabled:opacity-50"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
                </button>
              </form>
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
