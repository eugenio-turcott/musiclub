// src/pages/PlaylistsPage.jsx
import React from 'react';
import { PlaylistsCatalog } from '../components/PlaylistsCatalog';
import { SEO } from '../components/SEO';

export function PlaylistsPage() {
  return (
    <>
      <SEO
        title="Playlists Comunitarias y Listas Musicales | Musiclub"
        description="Explora playlists temáticas y selecciones de canciones creadas por la comunidad de melómanos de Musiclub."
        url="https://www.musiclub.org/playlists"
        keywords="playlists de musica, listas de spotify, canciones recomendadas, playlists tematicas, musiclub playlists"
      />
      <PlaylistsCatalog isPage={true} />
    </>
  );
}
