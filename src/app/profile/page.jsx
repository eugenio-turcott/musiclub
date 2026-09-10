import React from 'react';
import { ProfilePage } from '../../views/ProfilePage';

export const metadata = {
  title: 'Perfil de Melómano | Musiclub',
  description:
    'Tu perfil en Musiclub. Tus calificaciones, estadísticas musicales, insignias y progreso en el club.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileRoutePage() {
  return <ProfilePage />;
}
