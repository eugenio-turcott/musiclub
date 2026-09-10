'use client';

import React, { useEffect } from 'react';

export function SEO({
  title = 'Musiclub - Reviews From & For Music Lovers',
  description = 'Descubre, califica y reseña álbumes, EPs y canciones en Musiclub. Únete a la comunidad de melómanos para explorar rankings globales y recomendaciones.',
  image = '/musiclub_logo_corchea.png',
  url = 'https://www.musiclub.org',
  type = 'website',
  keywords = 'musica, albumes, reviews, calificaciones, club de musica, reseñas musicales, discografia, canciones',
  schemaData = null,
}) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (title) document.title = title;
      if (description) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', description);
      }
    }
  }, [title, description]);

  if (schemaData) {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
    );
  }

  return null;
}
