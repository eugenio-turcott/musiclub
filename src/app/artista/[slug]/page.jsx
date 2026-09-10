import React from 'react';
import { ArtistDetail } from '../../../components/ArtistDetail';

export const revalidate = 3600; // Incremental Static Regeneration

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const artistName = slug
    ? decodeURIComponent(slug)
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    : 'Artista';

  const canonicalUrl = `https://www.musiclub.org/artista/${slug}`;
  const title = `${artistName} - Discografía, Álbumes y Calificaciones`;
  const description = `Explora la discografía completa de ${artistName} en Musiclub. Calificaciones comunitarias, opiniones de álbumes, mejores pistas y reviews de canciones.`;

  return {
    title,
    description,
    keywords: [
      artistName,
      'discografia',
      'albumes',
      'musica',
      'canciones',
      'calificaciones',
      'reviews',
      'musiclub',
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
      type: 'profile',
      images: [
        {
          url: 'https://www.musiclub.org/musiclub_logo_corchea.png',
          width: 1200,
          height: 630,
          alt: artistName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.musiclub.org/musiclub_logo_corchea.png'],
    },
  };
}

export default async function ArtistPage({ params }) {
  const { slug } = await params;
  const artistName = slug
    ? decodeURIComponent(slug)
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    : 'Artista';

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artistName,
    url: `https://www.musiclub.org/artista/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <ArtistDetail initialSlug={slug} />
    </>
  );
}
