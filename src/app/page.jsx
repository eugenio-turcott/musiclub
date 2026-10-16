import React from 'react';
import { LandingPage } from '../views/LandingPage';
import { getPublicCatalog } from '../server/catalog';

export const revalidate = 300;

export const metadata = {
  title: 'Musiclub - Reviews From & For Music Lovers',
  description:
    'Descubre, califica y reseña álbumes, EPs y canciones en Musiclub. Únete a la comunidad de melómanos para explorar rankings globales, recomendaciones personalizadas, análisis detallados pista por pista y el pool musical semanal.',
  alternates: {
    canonical: 'https://www.musiclub.org',
  },
};

export default async function HomePage() {
  const data = await getPublicCatalog();
  return <LandingPage initialAlbums={data.albums} initialReviews={data.reviews} initialStats={data.stats} />;
}
