import React from 'react';
import { PlaylistsPage } from '../../views/PlaylistsPage';

export const metadata = {
  title: 'Playlists Comunitarias y Listas Musicales | Musiclub',
  description:
    'Explora playlists temáticas y selecciones de canciones creadas por la comunidad de melómanos de Musiclub.',
  alternates: {
    canonical: 'https://www.musiclub.org/playlists',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PlaylistsRoutePage() {
  return <PlaylistsPage />;
}
