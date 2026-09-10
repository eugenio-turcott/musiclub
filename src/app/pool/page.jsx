import React from 'react';
import { PoolPage } from '../../views/PoolPage';

export const metadata = {
  title: 'Pool Musical Comunitario y Temporadas | Musiclub',
  description:
    'Participa en las nominaciones de álbumes de la semana, votaciones del pool musical y descubre la selección comunitaria en Musiclub.',
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
