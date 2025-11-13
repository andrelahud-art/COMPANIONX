'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CITIES = ['Ciudad de México', 'Guadalajara', 'Monterrey', 'Tijuana', 'León'];
const INTERESTS = ['gastronomía', 'fútbol', 'vida nocturna', 'historia', 'compras'];
const CERTIFICATIONS = ['first_aid', 'driver', 'tour_guide', 'translator'];
const LANGS = ['es', 'en', 'fr', 'pt'];
const VEHICLES = ['none', 'car', 'suv', 'van'];

export default function CompanionOnboardingPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [cities, setCities] = useState<string[]>(['Ciudad de México']);
  const [baseCity, setBaseCity] = useState('Ciudad de México');
  const [interests, setInterests] = useState<string[]>(['gastronomía']);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState(450);
  const [vehicleType, setVehicleType] = useState<string>('none');
  const [bio, setBio] = useState('');
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
      const response = await fetch('/api/onboarding/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cities,
          baseCity,
          interests,
          certifications,
          hourlyRateMXN: hourlyRate,
          hasVehicle: vehicleType !== 'none',
          vehicleType: vehicleType === 'none' ? undefined : vehicleType,
          bio,
          languages,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? 'No se pudo completar tu perfil');
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
        <h1 className="text-3xl font-semibold text-gray-900">Activa tu perfil de acompañante</h1>
        <p className="mt-2 text-gray-500">
          Completa la información clave para aparecer en los resultados de búsqueda y recibir tus primeras reservas.
        </p>

        <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
          <section>
            <h2 className="text-lg font-semibold text-gray-800">Cobertura de ciudades</h2>
            <p className="text-sm text-gray-500">Selecciona las ciudades donde puedes acompañar visitantes.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {CITIES.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => toggleValue(city, cities, setCities)}
                  className={`rounded-lg border px-4 py-3 text-left transition ${
                    cities.includes(city)
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
              <Label htmlFor="baseCity">Ciudad base</Label>
              <Input id="baseCity" value={baseCity} onChange={(e) => setBaseCity(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Tarifa por hora (MXN)</Label>
              <Input
                id="rate"
                type="number"
                min={200}
                step={25}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                required
              />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800">Idiomas y movilidad</h2>
            <div className="mt-3 flex flex-wrap gap-2">
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
            <div className="mt-4 flex flex-wrap gap-3">
              {VEHICLES.map((vehicle) => (
                <button
                  key={vehicle}
                  type="button"
                  onClick={() => setVehicleType(vehicle)}
                  className={`rounded-full border px-4 py-2 text-sm capitalize transition ${
                    vehicleType === vehicle
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 hover:border-primary/50'
                  }`}
                >
                  {vehicle === 'none' ? 'Sin vehículo' : vehicle}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800">Intereses y certificaciones</h2>
            <div className="mt-3 flex flex-wrap gap-3">
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
            <div className="mt-4 flex flex-wrap gap-3">
              {CERTIFICATIONS.map((cert) => (
                <button
                  key={cert}
                  type="button"
                  onClick={() => toggleValue(cert, certifications, setCertifications)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    certifications.includes(cert)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 hover:border-primary/50'
                  }`}
                >
                  {cert.replace('_', ' ')}
                </button>
              ))}
            </div>
          </section>

          <section>
            <Label htmlFor="bio">Biografía</Label>
            <textarea
              id="bio"
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none"
              rows={5}
              placeholder="Comparte tu experiencia guiando visitantes, tus pasiones y lo que te hace especial."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </section>

          {error && <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading || cities.length === 0 || languages.length === 0}>
            {loading ? 'Guardando...' : 'Publicar mi perfil'}
          </Button>
        </form>
      </div>
    </div>
  );
}
