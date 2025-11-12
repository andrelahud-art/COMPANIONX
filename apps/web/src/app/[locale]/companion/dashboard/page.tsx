'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, DollarSign, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Booking {
  id: string;
  city: string;
  from: string;
  to: string;
  status: string;
  priceMXN: number;
  visitor: {
    name: string;
    avatarUrl: string | null;
    rating: number;
  };
}

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  totalEarnings: number;
}

export default function CompanionDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/companion/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings.slice(0, 5)); // Solo las 5 más recientes
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      PENDING: { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      PAID: { text: 'Confirmado', color: 'bg-green-100 text-green-800' },
      IN_PROGRESS: { text: 'En Progreso', color: 'bg-blue-100 text-blue-800' },
      COMPLETED: { text: 'Completado', color: 'bg-gray-100 text-gray-800' },
      CANCELED: { text: 'Cancelado', color: 'bg-red-100 text-red-800' },
    };

    const { text, color } = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Bienvenido de vuelta! Aquí está tu resumen
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Requieren tu atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.confirmed || 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Próximas citas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <Star className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Total de servicios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ganancias Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats?.totalEarnings || 0).toLocaleString('es-MX')} MXN
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Servicios completados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Solicitudes Recientes</CardTitle>
              <CardDescription>Las últimas solicitudes de servicio</CardDescription>
            </div>
            <Link href="/companion/bookings">
              <Button variant="outline">Ver Todas</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tienes solicitudes aún</p>
              <p className="text-sm mt-2">
                Las solicitudes aparecerán aquí cuando los visitantes te reserven
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {booking.visitor.avatarUrl ? (
                        <img
                          src={booking.visitor.avatarUrl}
                          alt={booking.visitor.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                          {booking.visitor.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {booking.visitor.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {booking.city} • {new Date(booking.from).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ${booking.priceMXN.toLocaleString('es-MX')} MXN
                      </p>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
