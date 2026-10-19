'use client';
// src/views/RecommendationsPage.jsx
import React from 'react';
import { Recommendations } from '../components/Recommendations';
import { SEO } from '../components/SEO';

export function RecommendationsPage({ initialAlbums = [] }) {
  return (
    <div className="min-h-screen cyber-grid p-3 sm:p-6 w-full max-w-full overflow-x-hidden">
      <SEO
        title="Para Ti: géneros y recomendaciones del club | Musiclub"
        description="Descubre las selecciones de la comunidad. Con diez lanzamientos calificados, recibe recomendaciones basadas en tus géneros escuchados y valoraciones."
        url="https://www.musiclub.org/recomendaciones"
        keywords="recomendaciones de musica, descubrir musica, nuevos albumes, que musica escuchar, musiclub recomendaciones"
      />
      <Recommendations isPage={true} initialAlbums={initialAlbums} />
    </div>
  );
}

export default RecommendationsPage;
