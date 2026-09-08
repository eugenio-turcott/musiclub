// src/pages/AlbumsPage.jsx
import React from 'react';
import { AlbumsCatalog } from '../components/AlbumsCatalog';
import { SEO } from '../components/SEO';

export function AlbumsPage() {
  return (
    <>
      <SEO
        title="Catálogo de Álbumes, EPs y Reviews de Música | Musiclub"
        description="Explora el catálogo completo de álbumes, EPs y sencillos reseñados y calificados por la comunidad de Musiclub. Descubre notas, tracklists y opiniones."
        url="https://www.musiclub.org/catalogo"
        keywords="catalogo de albumes, discografias, reviews de musica, mejores albumes, calificaciones musicales, canciones, musiclub"
      />
      <AlbumsCatalog isPage={true} />
    </>
  );
}
