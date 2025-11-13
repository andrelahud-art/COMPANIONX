'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface BookingSummary {
  id: string;
  city: string;
  from: string;
  to: string;
  status: string;
  priceMXN: number;
  platformFeeMXN: number;
  durationHours: number;
  visitor?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  companion?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchBookings = async () => {
      setLoadingBookings(true);
      setError(null);
      try {
        const response = await fetch('/api/bookings', { cache: 'no-store' });
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error ?? 'No se pudieron cargar las reservas');
        }
        const payload = await response.json();
        setBookings(payload.bookings ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookings();
  }, [user]);

  if (!user && !loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Necesitas iniciar sesión</CardTitle>
            <CardDescription>Accede con tu cuenta para ver tus reservas y recomendaciones.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild>
              <Link href="/auth/login">Iniciar sesión</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/register">Crear cuenta</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase text-primary">Bienvenido de nuevo</p>
            <h1 className="text-3xl font-semibold text-gray-900">Hola, {user?.name ?? 'explorador'}</h1>
            <p className="text-sm text-gray-500">
              Revisa tus próximas experiencias, gestiona mensajes y confirma pagos pendientes.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={signOut}>
              Cerrar sesión
            </Button>
            <Button asChild>
              <Link href="/search">Buscar acompañantes</Link>
            </Button>
          </div>
        </header>

        {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Reservas activas</CardTitle>
              <CardDescription>Tu agenda confirmada para el Mundial.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingBookings ? (
                <p className="text-sm text-gray-500">Cargando reservas...</p>
              ) : bookings.length === 0 ? (
                <p className="text-sm text-gray-500">Aún no tienes reservas. Explora acompañantes para comenzar.</p>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-primary">{booking.city}</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatDateTime(new Date(booking.from))} - {formatDateTime(new Date(booking.to))}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
                          {booking.status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                        <span>Duración: {booking.durationHours.toFixed(1)} h</span>
                        <span>Precio: {formatCurrency(booking.priceMXN)}</span>
                        {user?.role === 'COMPANION' ? (
                          <span>Visitante: {booking.visitor?.name ?? 'N/A'}</span>
                        ) : (
                          <span>Acompañante: {booking.companion?.name ?? 'N/A'}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Checklist de activación</CardTitle>
              <CardDescription>Tareas pendientes para operar sin fricciones.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-gray-900">1. Completa tu onboarding</p>
                <p className="text-gray-500">Actualiza tu perfil desde la sección de onboarding si falta información.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">2. Configura tu método de pago</p>
                <p className="text-gray-500">Recibirás instrucciones para Stripe Connect en tu correo al confirmar la primera reserva.</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">3. Activa notificaciones</p>
                <p className="text-gray-500">Agrega CompanionX a tu pantalla de inicio y permite notificaciones push.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
