'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Chrome, Facebook } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Register
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Erreur lors de l\'inscription');
        setLoading(false);
        return;
      }

      // Auto-login after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push('/auth/login');
      } else {
        router.push('/dashboard');
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
            <h1 className="text-3xl font-bold text-white mb-2">Inscription</h1>
            <p className="text-gray-400">Cr\u00e9ez votre compte Studiio gratuitement</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition"
            >
              <Chrome size={20} />
              S&apos;inscrire avec Google
            </button>
            <button
              onClick={() => signIn('facebook', { callbackUrl: '/dashboard' })}
              className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition"
            >
              <Facebook size={20} />
              S&apos;inscrire avec Facebook
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-500">Ou</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nom complet</label>
              <input
                type="text"
                className="input-base w-full"
                placeholder="Jean Dupont"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                className="input-base w-full"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Mot de passe</label>
              <input
                type="password"
                className="input-base w-full"
                placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full button-primary disabled:opacity-50"
            >
              {loading ? 'Inscription...' : 'S\'inscrire'}
            </button>
          </form>

          <div className="text-center text-sm text-gray-400">
            <p>En vous inscrivant, vous acceptez nos <span className="text-studiio-primary cursor-pointer">Conditions d&apos;utilisation</span> et notre <span className="text-studiio-primary cursor-pointer">Politique de confidentialit\u00e9</span>.</p>
          </div>

          <div className="text-center">
            <p className="text-gray-400">
              Vous avez d\u00e9j\u00e0 un compte ?{' '}
              <Link href="/auth/login" className="text-studiio-primary hover:text-purple-400 font-semibold">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
