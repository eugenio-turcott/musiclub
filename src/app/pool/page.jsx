import React from 'react';
import { PoolPage } from '../../views/PoolPage';

export const metadata = {
  title: 'Salas de escucha y Pool Musical',
  description:
    'Cada sala tiene su propio Pool. Descubre salas públicas o comparte una privada con tu grupo: propuestas, temporadas, selección e historial independientes.',
  alternates: {
    canonical: 'https://www.musiclub.org/pool',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PoolRoutePage() {
  return <PoolPage />;
}
