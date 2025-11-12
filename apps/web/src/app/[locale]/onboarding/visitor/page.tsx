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

export default function VisitorOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
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

  const handleComplete = async () => {
    setLoading(true);
    // TODO: Save onboarding data to database
    // For now, just redirect to home
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Bienvenido, Visitante</CardTitle>
          <CardDescription>
            Completa tu perfil para encontrar el acompañante perfecto
          </CardDescription>
          <div className="mt-4">
            <div className="flex gap-2">
              <div className={`h-2 flex-1 rounded ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
              <div className={`h-2 flex-1 rounded ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
            </div>
            <p className="text-sm text-gray-600 mt-2">Paso {step} de 2</p>
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  ¿Qué ciudades visitarás durante el Mundial 2026?
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
                  ¿Qué te interesa hacer?
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
                  onClick={handleComplete}
                  disabled={selectedInterests.length === 0 || loading}
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
