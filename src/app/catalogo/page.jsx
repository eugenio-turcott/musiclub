import React, { Suspense } from 'react';
import { AlbumsPage } from '../../views/AlbumsPage';
import { getPublicCatalog } from '../../server/catalog';
import { notFound } from 'next/navigation';

export const revalidate = 300;

const catalogMetadata = {
  title: 'Catálogo Musical',
  description:
    'Explora el catálogo completo de álbumes, EPs y sencillos reseñados y calificados por la comunidad de Musiclub. Descubre notas, tracklists y opiniones.',
  alternates: {
    canonical: 'https://www.musiclub.org/catalogo',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Catálogo Musical',
    description:
      'Explora el catálogo completo de álbumes, EPs y sencillos reseñados y calificados por la comunidad de Musiclub. Descubre notas, tracklists y opiniones.',
    url: 'https://www.musiclub.org/catalogo',
    siteName: 'Musiclub',
    images: [{ url: 'https://www.musiclub.org/musiclub_logo_corchea.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catálogo Musical',
    description:
      'Explora el catálogo completo de álbumes, EPs y sencillos reseñados y calificados por la comunidad de Musiclub.',
    images: ['https://www.musiclub.org/musiclub_logo_corchea.png'],
  },
};

export async function generateMetadata({ searchParams }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  return { ...catalogMetadata, ...((await searchParams).q ? { robots: { index: false, follow: true } } : {}), title: page > 1 ? `Catálogo Musical - Página ${page}` : catalogMetadata.title,
    alternates: { canonical: `https://www.musiclub.org/catalogo${page > 1 ? `?page=${page}` : ''}` } };
}
export default async function CatalogoPage({ searchParams }) {
  const { albums } = await getPublicCatalog();
  const query = String((await searchParams).q || '').slice(0, 150);
  const page = Number((await searchParams).page || 1);
  if (!Number.isInteger(page) || page < 1 || page > Math.ceil(albums.length / 20)) notFound();
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0b0f]" />}>
      <AlbumsPage key={`${page}:${query}`} initialAlbums={albums} initialPage={page} initialQuery={query} />
    </Suspense>
  );
}
