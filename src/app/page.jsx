import React from 'react';
import { LandingPage } from '../views/LandingPage';

export const metadata = {
  title: 'Musiclub - Reviews From & For Music Lovers',
  description:
    'Descubre, califica y reseña álbumes, EPs y canciones en Musiclub. Únete a la comunidad de melómanos para explorar rankings globales, recomendaciones personalizadas, análisis detallados pista por pista y el pool musical semanal.',
  alternates: {
    canonical: 'https://www.musiclub.org',
  },
};

export default function HomePage() {
  return <LandingPage />;
}
