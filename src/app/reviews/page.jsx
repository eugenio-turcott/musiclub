import React from 'react';
import { ReviewsPage } from '../../views/ReviewsPage';

export const metadata = {
  title: 'Reseñas y Opiniones de Álbumes de la Comunidad | Musiclub',
  description:
    'Lee las últimas reseñas, opiniones y calificaciones de álbumes de música publicadas por los miembros de la comunidad de Musiclub.',
  alternates: {
    canonical: 'https://www.musiclub.org/reviews',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Reseñas y Opiniones de Álbumes de la Comunidad | Musiclub',
    description:
      'Lee las últimas reseñas, opiniones y calificaciones de álbumes de música publicadas por los miembros de la comunidad de Musiclub.',
    url: 'https://www.musiclub.org/reviews',
    siteName: 'Musiclub',
    images: [{ url: 'https://www.musiclub.org/musiclub_logo_corchea.png' }],
  },
};

export default function ReviewsRoutePage() {
  return <ReviewsPage />;
}
