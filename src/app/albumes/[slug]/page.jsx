import React from 'react';
import { getPublicAlbum } from '../../../server/catalog';
import { notFound, permanentRedirect } from 'next/navigation';
import { headers } from 'next/headers';
import { jsonLd } from '../../../utils/publicData';
import {
  slugifyArtist,
  getReleaseTypeCategory,
  getReleaseUrl,
  getWeightedReviewScore,
} from '../../../utils/ratingUtils';
import { AlbumDetail } from '../../../components/AlbumDetail';

export const revalidate = 3600; // Incremental Static Regeneration (1 hora)

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const album = await getPublicAlbum(slug);

  if (!album) notFound();

  const name = album.album_name;
  const artist = album.artist_name;
  const category = getReleaseTypeCategory(album.release_type);
  const canonicalUrl = `https://www.musiclub.org${getReleaseUrl(album)}`;
  const scoreText =
    album.final_rating !== null && album.final_rating !== undefined
      ? `${album.final_rating}/10`
      : 'Sin calificar aún';
  const reviewsCountText =
    album.review_count > 0
      ? ` con ${album.review_count} reseña${album.review_count > 1 ? 's' : ''}`
      : '';

  const title = `${name} de ${artist} - Reseña, Calificación y Tracklist`;
  const description = `Califica y lee opiniones del ${category.singularLabel.toLowerCase()} "${name}" de ${artist} (${album.release_year || 'Música'}). Calificación comunitaria: ${scoreText}${reviewsCountText}.`;
  const imageUrl =
    album.image_url || 'https://www.musiclub.org/musiclub_logo_corchea.png';

  return {
    title,
    description,
    keywords: [
      name,
      artist,
      'musica',
      'review',
      'calificacion',
      'reseña',
      category.singularLabel.toLowerCase(),
      'tracklist',
      'musiclub',
      ...(album.genres || []),
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Musiclub',
      type: 'music.album',
      images: [
        {
          url: imageUrl,
          width: 640,
          height: 640,
          alt: `${name} - ${artist}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function AlbumPage({ params }) {
  const { slug } = await params;
  const album = await getPublicAlbum(slug);
  if (!album) notFound();
  const canonicalPath = getReleaseUrl(album);
  const currentPath = (await headers()).get('x-musiclub-pathname') || `/albumes/${slug}`;
  if (decodeURI(currentPath) !== canonicalPath) permanentRedirect(canonicalPath);

  const schemaData = album
    ? {
        '@context': 'https://schema.org',
        '@type': 'MusicAlbum',
        name: album.album_name,
        byArtist: {
          '@type': 'MusicGroup',
          name: album.artist_name,
          url: `https://www.musiclub.org/artista/${slugifyArtist(album.artist_name)}`,
        },
        image: album.image_url,
        ...(album.release_date ? { datePublished: album.release_date } : {}),
        ...(album.genres && album.genres.length > 0
          ? { genre: album.genres }
          : {}),
        url: `https://www.musiclub.org${getReleaseUrl(album)}`,
        review: (album.reviews || []).filter(r => r.comment?.trim() && r.reviewer_name && Number(r.rating_general) >= 1).map(r => ({
          '@type': 'Review', author: { '@type': 'Person', name: r.reviewer_name },
          reviewBody: r.comment, datePublished: r.created_at,
          reviewRating: { '@type': 'Rating', ratingValue: getWeightedReviewScore(r), bestRating: 10, worstRating: 1 },
        })),
        ...(album.final_rating && album.review_count > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: album.final_rating,
                bestRating: 10,
                worstRating: 1,
                ratingCount: album.review_count,
              },
            }
          : {}),
        ...(album.tracks && album.tracks.length > 0
          ? {
              numTracks: album.tracks.length,
              track: album.tracks.map((t, idx) => ({
                '@type': 'MusicRecording',
                name: typeof t === 'string' ? t : t.name || `Pista ${idx + 1}`,
                position:
                  typeof t === 'object' && t.track_number
                    ? t.track_number
                    : idx + 1,
                ...(typeof t === 'object' && t.duration_ms
                  ? {
                      duration: `PT${Math.round(t.duration_ms / 1000)}S`,
                    }
                  : {}),
              })),
            }
          : {}),
      }
    : null;

  return (
    <>
      {schemaData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(schemaData) }}
        />
      )}
      <AlbumDetail preloadedAlbum={album} initialSlug={slug} />
    </>
  );
}
