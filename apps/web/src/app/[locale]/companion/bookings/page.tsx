'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, User } from 'lucide-react';

interface Booking {
  id: string;
  city: string;
  from: string;
  to: string;
  durationHours: number;
  status: string;
  priceMXN: number;
  companionPayoutMXN: number;
  notes: string | null;
  createdAt: string;
  visitor: {
    id: string;
    name: string;
    avatarUrl: string | null;
    rating: number;
  };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/companion/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      PENDING: { text: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
      PAID: { text: 'Confirmado', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
      IN_PROGRESS: { text: 'En Progreso', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      COMPLETED: { text: 'Completado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      CANCELED: { text: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    };

    const { text, color } = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${color}`}>
        {text}
      </span>
    );
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'ALL') return true;
    return booking.status === filter;
  });

  const filterButtons = [
    { key: 'ALL', label: 'Todas', count: bookings.length },
    { key: 'PENDING', label: 'Pendientes', count: bookings.filter(b => b.status === 'PENDING').length },
    { key: 'PAID', label: 'Confirmadas', count: bookings.filter(b => b.status === 'PAID').length },
    { key: 'IN_PROGRESS', label: 'En Progreso', count: bookings.filter(b => b.status === 'IN_PROGRESS').length },
    { key: 'COMPLETED', label: 'Completadas', count: bookings.filter(b => b.status === 'COMPLETED').length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Solicitudes</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gestiona tus reservaciones y solicitudes de servicio
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === btn.key
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {btn.label} ({btn.count})
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {filter === 'ALL'
                ? 'No tienes solicitudes aún'
                : `No tienes solicitudes ${filterButtons.find(b => b.key === filter)?.label.toLowerCase()}`
              }
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Las solicitudes aparecerán aquí cuando los visitantes te reserven
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {booking.visitor.avatarUrl ? (
                        <img
                          src={booking.visitor.avatarUrl}
                          alt={booking.visitor.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{booking.visitor.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1">
                          ⭐ {booking.visitor.rating.toFixed(1)}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ciudad</p>
                      <p className="text-gray-900 dark:text-white">{booking.city}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha</p>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(booking.from).toLocaleDateString('es-MX', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Duración</p>
                      <p className="text-gray-900 dark:text-white">
                        {booking.durationHours} {booking.durationHours === 1 ? 'hora' : 'horas'}
                      </p>
                    </div>
                  </div>
                </div>

                {booking.notes && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Notas del visitante
                    </p>
                    <p className="text-gray-900 dark:text-white">{booking.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tu pago</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${booking.companionPayoutMXN.toLocaleString('es-MX')} MXN
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Total: ${booking.priceMXN.toLocaleString('es-MX')} MXN
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {booking.status === 'PENDING' && (
                      <>
                        <Button variant="outline">Rechazar</Button>
                        <Button>Aceptar</Button>
                      </>
                    )}
                    {booking.status === 'PAID' && (
                      <Button variant="outline">Ver Detalles</Button>
                    )}
                    {booking.status === 'IN_PROGRESS' && (
                      <Button>Marcar como Completado</Button>
                    )}
                    {booking.status === 'COMPLETED' && (
                      <Button variant="outline">Ver Reseña</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
