import React from 'react';
import { RecommendationsPage } from '../../views/RecommendationsPage';
import { getPublicCatalog } from '../../server/catalog';
export const revalidate = 300;

export const metadata = {
  title: 'Para Ti: géneros y recomendaciones del club',
  description:
    'Descubre las selecciones de la comunidad. Con diez lanzamientos calificados, recibe recomendaciones basadas en tus géneros escuchados y valoraciones.',
  alternates: {
    canonical: 'https://www.musiclub.org/recomendaciones',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RecomendacionesRoutePage() {
  const { albums } = await getPublicCatalog();
  return <RecommendationsPage initialAlbums={albums} />;
}
