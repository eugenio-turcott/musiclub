import React from 'react';
import { PatchNotesPage } from '../../views/PatchNotesPage';

export const metadata = {
  title: 'Patch Notes & Historial de Actualizaciones | Musiclub',
  description:
    'Consulta el registro completo de cambios, nuevas funciones, mejoras y correcciones de Musiclub sincronizado en tiempo real con GitHub.',
  alternates: {
    canonical: 'https://www.musiclub.org/patch-notes',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PatchNotesRoutePage() {
  return <PatchNotesPage />;
}
