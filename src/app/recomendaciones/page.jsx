import React from 'react';
import { RecommendationsPage } from '../../views/RecommendationsPage';

export const metadata = {
  title: 'Recomendaciones Musicales Inteligentes | Musiclub',
  description:
    'Descubre álbumes y artistas afines a tus gustos musicales con el motor de recomendaciones personalizadas de Musiclub.',
  alternates: {
    canonical: 'https://www.musiclub.org/recomendaciones',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RecomendacionesRoutePage() {
  return <RecommendationsPage />;
}
