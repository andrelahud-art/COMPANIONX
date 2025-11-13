'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function NewBookingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [companionId] = useState(() => params.get('companionId') ?? '');
  const [city, setCity] = useState(() => params.get('city') ?? '');
  const [from, setFrom] = useState(() => params.get('from') ?? '');
  const [to, setTo] = useState(() => params.get('to') ?? '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companionId, city, from, to, notes }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? 'No se pudo crear la reserva');
      }

      router.push(`/dashboard?booking=${payload.booking.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 shadow-xl">
        <h1 className="text-2xl font-semibold text-gray-900">Confirma tu reserva</h1>
        <p className="mt-2 text-sm text-gray-500">Revisa los datos antes de enviar tu solicitud al acompañante.</p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="companion">ID del acompañante</Label>
            <Input id="companion" value={companionId} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" value={city} onChange={(event) => setCity(event.target.value)} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from">Desde</Label>
              <Input id="from" type="datetime-local" value={from} onChange={(event) => setFrom(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">Hasta</Label>
              <Input id="to" type="datetime-local" value={to} onChange={(event) => setTo(event.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <textarea
              id="notes"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Detalla punto de encuentro, expectativas, preferencias específicas..."
            />
          </div>

          {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading || !companionId}>
              {loading ? 'Enviando...' : 'Solicitar reserva'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
