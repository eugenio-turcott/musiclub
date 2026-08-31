// src/components/SEO.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

export function SEO({
  title = 'Musiclub - Descubre, Califica y Sortea Álbumes',
  description = 'Musiclub es una plataforma interactiva para descubrir, sortear, calificar y reseñar álbumes de música en comunidad.',
  image = '/og-image.png',
  url = 'https://musiclub.org',
  type = 'website',
  keywords = 'musica, albumes, reviews, calificaciones, club de musica, reseñas musicales',
  schemaData = null,
}) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Musiclub" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional */}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />

      {/* JSON-LD Structured Data */}
      {schemaData && (
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      )}
    </Helmet>
  );
}
