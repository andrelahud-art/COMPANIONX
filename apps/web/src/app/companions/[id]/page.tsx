'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface CompanionDetail {
  id: string;
  bio: string | null;
  tagline: string | null;
  cities: string[];
  baseCity: string | null;
  interests: string[];
  certifications: string[];
  hourlyRateMXN: number;
  hasVehicle: boolean;
  vehicleType: string | null;
  photos: string[];
  isVerified: boolean;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    languages: string[];
    rating: number;
    ratingsCount: number;
    kycLevel: string;
  };
  availability: { id: string; from: string; to: string; city: string }[];
}

export default function CompanionProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [companion, setCompanion] = useState<CompanionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCompanion = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/companions/${params?.id}`);
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error ?? 'No encontramos el perfil solicitado');
        }
        const payload = await response.json();
        setCompanion(payload.companion);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      fetchCompanion();
    }
  }, [params?.id]);

  if (loading) {
    return <p className="p-10 text-center text-sm text-gray-500">Cargando perfil...</p>;
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4">
        <p className="text-sm text-red-600">{error}</p>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  if (!companion) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-semibold text-gray-900">{companion.user.name}</CardTitle>
            <CardDescription>
              {companion.baseCity ? `${companion.baseCity} · ` : ''}
              {companion.cities.join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-600">
            {companion.tagline && <p className="text-lg text-gray-800">“{companion.tagline}”</p>}
            {companion.bio && <p>{companion.bio}</p>}
            <div className="flex flex-wrap gap-4 text-xs uppercase tracking-wide text-gray-500">
              <span>Idiomas: {companion.user.languages.join(', ')}</span>
              <span>Tarifa base: {formatCurrency(companion.hourlyRateMXN)}</span>
              {companion.hasVehicle && <span>Transporte: {companion.vehicleType ?? 'Vehículo propio'}</span>}
              <span>Rating: {companion.user.rating.toFixed(1)} ({companion.user.ratingsCount} reseñas)</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Especialidades</h2>
              <p>{companion.interests.join(' · ')}</p>
            </div>
            {companion.certifications.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Certificaciones</h2>
                <p>{companion.certifications.map((cert) => cert.replace('_', ' ')).join(', ')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próxima disponibilidad</CardTitle>
            <CardDescription>Selecciona un horario libre para crear una reserva.</CardDescription>
          </CardHeader>
          <CardContent>
            {companion.availability.length === 0 ? (
              <p className="text-sm text-gray-500">No hay ventanas libres. Intenta con otra fecha o envía un mensaje.</p>
            ) : (
              <div className="space-y-3">
                {companion.availability.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{slot.city}</p>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(new Date(slot.from))} - {formatDateTime(new Date(slot.to))}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/bookings/new?companionId=${companion.id}&from=${slot.from}&to=${slot.to}&city=${slot.city}`}>
                        Reservar
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
