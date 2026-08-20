// src/components/SEO.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

export function SEO({
  title = 'Musiclub - Descubre, Califica y Sortea Álbumes',
  description = 'Musiclub es una plataforma interactiva para descubrir, sortear, calificar y reseñar álbumes de música en comunidad.',
  image = '/og-image.png',
  url = 'https://musiclub-albums.vercel.app',
}) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional */}
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={url} />
    </Helmet>
  );
}
