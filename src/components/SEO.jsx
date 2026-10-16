'use client';

import React from 'react';
import { jsonLd } from '../utils/publicData';

export function SEO({
  title = 'Musiclub - Reviews From & For Music Lovers',
  description = 'Descubre, califica y reseña álbumes, EPs y canciones en Musiclub. Únete a la comunidad de melómanos para explorar rankings globales y recomendaciones.',
  image = '/musiclub_logo_corchea.png',
  url = 'https://www.musiclub.org',
  type = 'website',
  keywords = 'musica, albumes, reviews, calificaciones, club de musica, reseñas musicales, discografia, canciones',
  schemaData = null,
}) {
  // Next's Metadata API owns document metadata. Do not overwrite it after hydration.

  if (schemaData) {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schemaData) }}
      />
    );
  }

  return null;
}
