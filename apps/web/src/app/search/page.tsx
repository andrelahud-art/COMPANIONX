'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface CompanionResult {
  companion: {
    id: string;
    userId: string;
    name: string;
    avatarUrl?: string | null;
    languages: string[];
    cities: string[];
    baseCity?: string | null;
    interests: string[];
    hasVehicle: boolean;
    vehicleType?: string | null;
    hourlyRateMXN: number;
    rating: number;
    ratingsCount: number;
    isVerified: boolean;
  };
  score: number;
  reasons: string[];
}

export default function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(() => params.get('query') ?? '');
  const [city, setCity] = useState(() => params.get('city') ?? '');
  const [language, setLanguage] = useState(() => params.get('language') ?? '');
  const [date, setDate] = useState(() => params.get('date') ?? '');
  const [maxPrice, setMaxPrice] = useState(() => (params.get('maxPriceMXN') ? Number(params.get('maxPriceMXN')) : 0));
  const [hasVehicle, setHasVehicle] = useState(() => params.get('hasVehicle') === 'true');
  const [results, setResults] = useState<CompanionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    const searchParams = new URLSearchParams();
    if (query) searchParams.set('query', query);
    if (city) searchParams.set('city', city);
    if (language) searchParams.set('language', language);
    if (date) searchParams.set('date', date);
    if (maxPrice > 0) searchParams.set('maxPriceMXN', String(maxPrice));
    if (hasVehicle) searchParams.set('hasVehicle', 'true');
    searchParams.set('limit', '12');

    router.replace(`/search?${searchParams.toString()}`, { scroll: false });

    try {
      const response = await fetch(`/api/companions/search?${searchParams.toString()}`);
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? 'No se pudieron cargar los acompañantes');
      }
      const payload = await response.json();
      setResults(payload.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Busca acompañantes verificados</CardTitle>
            <CardDescription>
              Ajusta los filtros para encontrar acompañantes alineados con tu idioma, ciudad y presupuesto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-5"
              onSubmit={(event) => {
                event.preventDefault();
                fetchResults();
              }}
            >
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="query">¿Qué tipo de experiencia buscas?</Label>
                <Input
                  id="query"
                  placeholder="tour gastronómico, guía futbolera, cultura..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ej. Monterrey" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Input id="language" value={language} onChange={(event) => setLanguage(event.target.value)} placeholder="es" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Presupuesto máximo (MXN)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={maxPrice || ''}
                  min={0}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                />
              </div>
              <div className="flex items-end gap-3 md:col-span-5">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={hasVehicle}
                    onChange={(event) => setHasVehicle(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Solo acompañantes con vehículo
                </label>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {results.map((result) => (
            <Card key={result.companion.id} className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">{result.companion.name}</CardTitle>
                    <CardDescription>
                      {result.companion.cities.join(', ')} · {result.companion.languages.join(', ')}
                    </CardDescription>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Score {result.score.toFixed(2)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <p>{formatCurrency(result.companion.hourlyRateMXN)} / hora</p>
                <p>{result.companion.interests.slice(0, 3).join(' · ')}</p>
                <ul className="list-disc pl-5 text-xs text-gray-500">
                  {result.reasons.slice(0, 3).map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <a href={`/companions/${result.companion.id}`}>Ver perfil</a>
                </Button>
              </CardContent>
            </Card>
          ))}
          {!loading && results.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>No encontramos resultados</CardTitle>
                <CardDescription>
                  Ajusta tus filtros o amplía tu búsqueda a más ciudades para descubrir acompañantes disponibles.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
