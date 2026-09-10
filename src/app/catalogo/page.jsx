import React from 'react';
import { AlbumsPage } from '../../views/AlbumsPage';

export const metadata = {
  title: 'Catálogo de Álbumes, EPs y Reviews de Música | Musiclub',
  description:
    'Explora el catálogo completo de álbumes, EPs y sencillos reseñados y calificados por la comunidad de Musiclub. Descubre notas, tracklists y opiniones.',
  alternates: {
    canonical: 'https://www.musiclub.org/catalogo',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Catálogo de Álbumes, EPs y Reviews de Música | Musiclub',
    description:
      'Explora el catálogo completo de álbumes, EPs y sencillos reseñados y calificados por la comunidad de Musiclub. Descubre notas, tracklists y opiniones.',
    url: 'https://www.musiclub.org/catalogo',
    siteName: 'Musiclub',
    images: [{ url: 'https://www.musiclub.org/musiclub_logo_corchea.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catálogo de Álbumes, EPs y Reviews de Música | Musiclub',
    description:
      'Explora el catálogo completo de álbumes, EPs y sencillos reseñados y calificados por la comunidad de Musiclub.',
    images: ['https://www.musiclub.org/musiclub_logo_corchea.png'],
  },
};

export default function CatalogoPage() {
  return <AlbumsPage />;
}
