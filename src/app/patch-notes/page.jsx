import React from 'react';
import { PatchNotesPage } from '../../views/PatchNotesPage';

export const metadata = {
  title: 'Patch Notes & Historial de Actualizaciones',
  description:
    'Las novedades de Musiclub, reunidas en un resumen por cada versión mayor.',
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
