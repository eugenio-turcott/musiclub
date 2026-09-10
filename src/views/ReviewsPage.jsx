'use client';
// src/views/ReviewsPage.jsx
import React from 'react';
import { Reviews as ReviewsComponent } from '../components/Reviews';
import { SEO } from '../components/SEO';

export function ReviewsPage() {
  return (
    <>
      <SEO
        title="Reseñas y Opiniones de Álbumes de la Comunidad | Musiclub"
        description="Lee las últimas reseñas, opiniones y calificaciones de álbumes de música publicadas por los miembros de la comunidad de Musiclub."
        url="https://www.musiclub.org/reviews"
        keywords="reseñas de musica, reviews de albumes, criticas de discos, calificaciones musicales, opiniones de musica, musiclub"
      />
      <ReviewsComponent isPage={true} onClose={() => {}} />
    </>
  );
}
