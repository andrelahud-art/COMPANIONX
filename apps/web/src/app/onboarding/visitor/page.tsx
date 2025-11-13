'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CITIES = ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Tijuana', 'León'];
const INTERESTS = ['gastronomía', 'fútbol', 'vida nocturna', 'historia', 'compras'];
const LANGS = ['es', 'en', 'fr', 'pt'];

export default function VisitorOnboardingPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [fifaCities, setFifaCities] = useState<string[]>(['Ciudad de México']);
  const [arrivalDate, setArrivalDate] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [budget, setBudget] = useState(4000);
  const [interests, setInterests] = useState<string[]>(['gastronomía']);
  const [languages, setLanguages] = useState<string[]>(['es']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleValue = (value: string, list: string[], setter: (values: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/onboarding/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fifaCities,
          arrivalDate: arrivalDate || undefined,
          departureDate: departureDate || undefined,
          interests,
          budgetMXN: budget,
          languages,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? 'No se pudo guardar tu información');
      }

      await refresh();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 shadow-xl">
        <h1 className="text-3xl font-semibold text-gray-900">Configura tu viaje</h1>
        <p className="mt-2 text-gray-500">
          Cuéntanos tus planes para recomendarte acompañantes con disponibilidad, idioma y presupuesto compatibles.
        </p>

        <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
          <section>
            <h2 className="text-lg font-semibold text-gray-800">Ciudades del Mundial</h2>
            <p className="text-sm text-gray-500">Selecciona las ciudades donde necesitarás acompañantes.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => toggleValue(city, fifaCities, setFifaCities)}
                  className={`rounded-lg border px-4 py-3 text-left transition ${
                    fifaCities.includes(city)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 hover:border-primary/50'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="arrival">Fecha de llegada</Label>
              <Input id="arrival" type="date" value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departure">Fecha de salida</Label>
              <Input id="departure" type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budget">Presupuesto aproximado (MXN por día)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                min={1000}
                step={500}
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Idiomas preferidos</Label>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleValue(lang, languages, setLanguages)}
                    className={`rounded-full border px-4 py-1 text-sm transition ${
                      languages.includes(lang)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 hover:border-primary/50'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800">Tus intereses</h2>
            <p className="text-sm text-gray-500">Los usaremos para priorizar acompañantes compatibles.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleValue(interest, interests, setInterests)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    interests.includes(interest)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 hover:border-primary/50'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </section>

          {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading || fifaCities.length === 0 || languages.length === 0}>
            {loading ? 'Guardando...' : 'Guardar y continuar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
