'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, MapPin, DollarSign, Languages, Star, Edit } from 'lucide-react';

interface CompanionProfile {
  id: string;
  cities: string[];
  interests: string[];
  hourlyRateMXN: number;
  bio: string | null;
  isActive: boolean;
  isVerified: boolean;
  totalBookings: number;
  completedBookings: number;
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
    rating: number;
    ratingsCount: number;
    languages: string[];
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<CompanionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/companion/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No se pudo cargar el perfil</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona tu información y configuración
          </p>
        </div>
        <Button onClick={() => setEditing(!editing)}>
          <Edit className="h-4 w-4 mr-2" />
          {editing ? 'Cancelar' : 'Editar Perfil'}
        </Button>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {profile.user.avatarUrl ? (
                <img
                  src={profile.user.avatarUrl}
                  alt={profile.user.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">{profile.user.name}</CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {profile.user.rating.toFixed(1)} ({profile.user.ratingsCount} reseñas)
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  profile.isVerified
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                  {profile.isVerified ? '✓ Verificado' : 'Pendiente de Verificación'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  profile.isActive
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {profile.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email</p>
              <p className="text-gray-900 dark:text-white">{profile.user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Reservaciones Totales</p>
              <p className="text-gray-900 dark:text-white text-2xl font-bold">{profile.totalBookings}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Completadas</p>
              <p className="text-gray-900 dark:text-white text-2xl font-bold">{profile.completedBookings}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>Ciudades</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.cities.map((city) => (
                <span
                  key={city}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded-full text-sm"
                >
                  {city}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>Tarifa</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${profile.hourlyRateMXN.toLocaleString('es-MX')} MXN
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">por hora</p>
          </CardContent>
        </Card>
      </div>

      {/* Interests & Languages */}
      <Card>
        <CardHeader>
          <CardTitle>Intereses y Habilidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Intereses</p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              <Languages className="h-4 w-4 inline mr-1" />
              Idiomas
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.user.languages.map((lang) => (
                <span
                  key={lang}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card>
        <CardHeader>
          <CardTitle>Biografía</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {profile.bio || 'No has agregado una biografía aún.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
