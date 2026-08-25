// src/pages/AlbumsPage.jsx
import React from 'react';
import { AlbumsCatalog } from '../components/AlbumsCatalog';
import { SEO } from '../components/SEO';

export function AlbumsPage() {
  return (
    <>
      <SEO
        title="Catálogo de Álbumes - Musiclub"
        description="Explora todos los álbumes calificados y por calificar por la comunidad de Musiclub. Descubre notas ponderadas, canciones favoritas y análisis de la comunidad."
        url="https://musiclub-albums.vercel.app/albumes"
      />
      <AlbumsCatalog isPage={true} />
    </>
  );
}
