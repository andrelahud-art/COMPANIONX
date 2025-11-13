'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RoleOption = 'VISITOR' | 'COMPANION';

export default function RegisterPage() {
  const router = useRouter();
  const { supabase, refresh } = useAuth();
  const [role, setRole] = useState<RoleOption>('VISITOR');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [languageMain, setLanguageMain] = useState('es');
  const [country, setCountry] = useState('MX');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          role,
          languageMain,
          country,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'No se pudo registrar la cuenta');
      }

      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (loginResponse.ok) {
        const loginPayload = await loginResponse.json();
        if (loginPayload.session?.accessToken && loginPayload.session?.refreshToken) {
          await supabase.auth.setSession({
            access_token: loginPayload.session.accessToken,
            refresh_token: loginPayload.session.refreshToken,
          });
        }
        await refresh();
        router.push(role === 'COMPANION' ? '/onboarding/companion' : '/onboarding/visitor');
        return;
      }

      router.push('/auth/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-2xl rounded-xl bg-white p-10 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold text-gray-900">Crea tu cuenta CompanionX</h1>
          <p className="mt-2 text-sm text-gray-500">Selecciona tu rol e ingresa los datos básicos para empezar.</p>
        </div>

        <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="md:col-span-2">
            <Label className="mb-2 block text-sm font-medium text-gray-700">¿Cómo quieres usar CompanionX?</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRole('VISITOR')}
                className={`rounded-lg border p-4 text-left transition ${
                  role === 'VISITOR'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-slate-200 hover:border-primary/50'
                }`}
              >
                <h3 className="text-lg font-semibold">Soy visitante</h3>
                <p className="mt-1 text-sm text-slate-500">Quiero reservar acompañantes para mis experiencias del Mundial.</p>
              </button>
              <button
                type="button"
                onClick={() => setRole('COMPANION')}
                className={`rounded-lg border p-4 text-left transition ${
                  role === 'COMPANION'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-slate-200 hover:border-primary/50'
                }`}
              >
                <h3 className="text-lg font-semibold">Soy acompañante</h3>
                <p className="mt-1 text-sm text-slate-500">Ofrezco experiencias locales y quiero recibir reservas verificadas.</p>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Idioma principal</Label>
            <Input
              id="language"
              placeholder="es"
              value={languageMain}
              onChange={(event) => setLanguageMain(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">País de residencia</Label>
            <Input id="country" value={country} onChange={(event) => setCountry(event.target.value)} required />
          </div>

          {error && (
            <div className="md:col-span-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="md:col-span-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
