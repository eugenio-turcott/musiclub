import React from 'react';
import { SettingsPage } from '../../views/SettingsPage';

export const metadata = {
  title: 'Configuración de Cuenta | Musiclub',
  description: 'Configura tu perfil de usuario y preferencias en Musiclub.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsRoutePage() {
  return <SettingsPage />;
}
