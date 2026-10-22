import React from 'react';
import reviewChronology from '../utils/reviewChronology.cjs';
import { LandingPage } from '../views/LandingPage';
import { getPublicCatalog } from '../server/catalog';

export const revalidate = 300;

export const metadata = {
  title: 'Musiclub - Reviews From & For Music Lovers',
  description:
    'Descubre, califica y reseña álbumes, EPs y canciones en Musiclub. Únete a la comunidad de melómanos para explorar rankings globales, recomendaciones personalizadas, análisis detallados pista por pista y el pool musical semanal.',
  alternates: {
    canonical: 'https://www.musiclub.org',
  },
};

export default async function HomePage() {
  const data = await getPublicCatalog();
  // The home is a selection; the complete collection remains on /catalogo.
  const selected = new Map();
  const add = album => selected.set(album.id, album);
  data.albums.filter(a => a.review_count > 0).sort((a, b) => b.final_rating - a.final_rating).slice(0, 15).forEach(add);
  [...data.albums].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 24).forEach(add);
  reviewChronology.latestCommunityReviews(data.reviews).forEach(review => {
    const album = data.albums.find(a => a.id === review.album_id || a.edition_member_ids?.includes(review.album_id));
    if (album) add(album);
  });
  const albums = [...selected.values()];
  const memberIds = new Set(albums.flatMap(album => [album.id, ...(album.edition_member_ids || [])]));
  const reviews = data.reviews.filter(review => memberIds.has(review.album_id));
  return <LandingPage initialAlbums={albums} initialReviews={reviews} initialStats={data.stats} />;
}
