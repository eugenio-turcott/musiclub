import React from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import { headers } from 'next/headers';
import { ArtistDetail } from '../../../components/ArtistDetail';
import { getPublicArtist } from '../../../server/catalog';
import { slugifyArtist } from '../../../utils/ratingUtils';

export const revalidate = 300;
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const artist = await getPublicArtist(slug);
  if (!artist) notFound();
  const name = artist.profile.artist.name;
  const url = `https://www.musiclub.org/artista/${slugifyArtist(name)}`;
  const title = `${name} - Discografía, Álbumes y Calificaciones`;
  const description = `Explora los discos de ${name}, sus calificaciones y las opiniones de la comunidad de Musiclub.`;
  return { title, description, alternates: { canonical: url },
    openGraph: { title, description, url, type: 'profile', images: artist.profile.artist.image ? [artist.profile.artist.image] : [] } };
}
export default async function ArtistPage({ params }) {
  const { slug } = await params;
  const artist = await getPublicArtist(slug);
  if (!artist) notFound();
  const canonicalPath = `/artista/${slugifyArtist(artist.profile.artist.name)}`;
  const pathname = (await headers()).get('x-musiclub-pathname') || `/artista/${slug}`;
  if (decodeURI(pathname) !== canonicalPath) permanentRedirect(encodeURI(canonicalPath));
  return <ArtistDetail key={slug} initialSlug={slug} initialProfileData={artist.profile} initialClubAlbums={artist.albums} />;
}
