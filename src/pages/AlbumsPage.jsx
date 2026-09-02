// src/pages/AlbumsPage.jsx
import React from 'react';
import { AlbumsCatalog } from '../components/AlbumsCatalog';
import { SEO } from '../components/SEO';

export function AlbumsPage() {
  return (
    <>
      <SEO
        title="Catálogo de Lanzamientos & Álbumes - Musiclub"
        description="Explora todos los álbumes, EPs y sencillos calificados por la comunidad de Musiclub. Descubre notas ponderadas, canciones favoritas y análisis de la comunidad."
        url="https://musiclub.org/catalogo"
      />
      <AlbumsCatalog isPage={true} />
    </>
  );
}
