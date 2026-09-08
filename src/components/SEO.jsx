// src/components/SEO.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

export function SEO({
  title = 'Musiclub - Reviews From & For Music Lovers',
  description = 'Descubre, califica y reseña álbumes, EPs y canciones en Musiclub. Únete a la comunidad de melómanos para explorar rankings globales y recomendaciones.',
  image = '/5662059.png',
  url = 'https://www.musiclub.org',
  type = 'website',
  keywords = 'musica, albumes, reviews, calificaciones, club de musica, reseñas musicales, discografia, canciones',
  schemaData = null,
}) {
  // Normalizar siempre al dominio canónico oficial con www y https
  const rawUrl = url || 'https://www.musiclub.org';
  const normalizedUrl = rawUrl
    .replace('https://musiclub.org', 'https://www.musiclub.org')
    .replace('http://musiclub.org', 'https://www.musiclub.org');

  const fullUrl = normalizedUrl.startsWith('http')
    ? normalizedUrl
    : `https://www.musiclub.org${normalizedUrl.startsWith('/') ? normalizedUrl : `/${normalizedUrl}`}`;

  const fullImage = image && image.startsWith('http')
    ? image
    : `https://www.musiclub.org${image ? (image.startsWith('/') ? image : `/${image}`) : '/5662059.png'}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Musiclub" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:url" content={fullUrl} />

      {/* Additional & Canonical */}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={fullUrl} />

      {/* JSON-LD Structured Data */}
      {schemaData && (
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      )}
    </Helmet>
  );
}
