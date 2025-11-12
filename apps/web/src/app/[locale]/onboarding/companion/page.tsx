'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const FIFA_CITIES = [
  'Ciudad de México',
  'Guadalajara',
  'Monterrey',
];

const INTERESTS = [
  'Turismo',
  'Gastronomía',
  'Vida Nocturna',
  'Deportes',
  'Cultura',
  'Compras',
  'Naturaleza',
  'Historia',
];

const LANGUAGES = [
  'Español',
  'Inglés',
  'Francés',
  'Alemán',
  'Italiano',
  'Portugués',
];

export default function CompanionOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState('500');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const toggleLanguage = (language: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language]
    );
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/companion/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cities: selectedCities,
          interests: selectedInterests,
          spokenLanguages: selectedLanguages,
          hourlyRateMXN: parseInt(hourlyRate),
          bio: bio.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Error al guardar el perfil');
        setLoading(false);
        return;
      }

      // Redirect to companion dashboard
      router.push('/companion/dashboard');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el perfil. Por favor intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Bienvenido, Acompañante</CardTitle>
          <CardDescription>
            Completa tu perfil para empezar a recibir solicitudes
          </CardDescription>
          <div className="mt-4">
            <div className="flex gap-2">
              <div className={`h-2 flex-1 rounded ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
              <div className={`h-2 flex-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
              <div className={`h-2 flex-1 rounded ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
              <div className={`h-2 flex-1 rounded ${step >= 4 ? 'bg-primary' : 'bg-gray-200'}`} />
            </div>
            <p className="text-sm text-gray-600 mt-2">Paso {step} de 4</p>
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  ¿En qué ciudades puedes ofrecer tus servicios?
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {FIFA_CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => toggleCity(city)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedCities.includes(city)
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{city}</span>
                        {selectedCities.includes(city) && (
                          <span className="text-primary">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => router.push('/')}>
                  Cancelar
                </Button>
                <GradientButton
                  variant="variant"
                  onClick={() => setStep(2)}
                  disabled={selectedCities.length === 0}
                >
                  Siguiente
                </GradientButton>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  ¿Qué actividades puedes ofrecer?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        selectedInterests.includes(interest)
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{interest}</div>
                      {selectedInterests.includes(interest) && (
                        <span className="text-primary text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Atrás
                </Button>
                <GradientButton
                  variant="variant"
                  onClick={() => setStep(3)}
                  disabled={selectedInterests.length === 0}
                >
                  Siguiente
                </GradientButton>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  ¿Qué idiomas hablas?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {LANGUAGES.map((language) => (
                    <button
                      key={language}
                      onClick={() => toggleLanguage(language)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        selectedLanguages.includes(language)
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{language}</div>
                      {selectedLanguages.includes(language) && (
                        <span className="text-primary text-xs">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Atrás
                </Button>
                <GradientButton
                  variant="variant"
                  onClick={() => setStep(4)}
                  disabled={selectedLanguages.length === 0}
                >
                  Siguiente
                </GradientButton>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Cuéntanos sobre ti
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Escribe una breve descripción que los visitantes verán en tu perfil
                </p>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 min-h-[120px]"
                  placeholder="Soy un guía turístico profesional con 5 años de experiencia..."
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Tarifa por hora
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  ¿Cuánto cobras por hora de acompañamiento? (MXN)
                </p>
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  min="100"
                  step="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Mínimo: $100 MXN/hora
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Atrás
                </Button>
                <GradientButton
                  variant="variant"
                  onClick={handleComplete}
                  disabled={!bio.trim() || parseInt(hourlyRate) < 100 || loading}
                >
                  {loading ? 'Guardando...' : 'Completar'}
                </GradientButton>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
