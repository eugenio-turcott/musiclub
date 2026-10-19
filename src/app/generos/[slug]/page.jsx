import React from 'react';
import { notFound } from 'next/navigation';
import { getPublicCatalog } from '../../../server/catalog';
import { GenreDetail } from '../../../components/GenreDetail';
import catalog from '../../../utils/genreCatalog.cjs';
import routes from '../../../utils/genreRoutes.cjs';
export const revalidate = 300;

export async function generateStaticParams() {
  const { albums } = await getPublicCatalog();
  return [...catalog.genreCounts(albums).keys()].map(id => ({slug: routes.genreSlug(id)}));
}
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const genre = routes.findGenreBySlug(slug);
  if (!genre) return { title: 'Género no encontrado', robots: {index:false,follow:true} };
  const { albums } = await getPublicCatalog();
  const count = catalog.filterByGenre(albums, genre.id).length;
  const description = `Explora ${count} lanzamientos de ${genre.name} en Musiclub: álbumes, EPs, sencillos y reseñas de la comunidad.`;
  return { title: `${genre.name}: lanzamientos y reseñas`, description,
    alternates: {canonical:'https://www.musiclub.org'+routes.genrePath(genre.id)},
    robots: {index:count>0,follow:true}, openGraph: {title:`${genre.name} | Musiclub`,description,url:'https://www.musiclub.org'+routes.genrePath(genre.id)} };
}
export default async function GenreRoute({ params }) {
  const { slug } = await params;
  const genre = routes.findGenreBySlug(slug);
  if (!genre) notFound();
  const { albums } = await getPublicCatalog();
  const releases = catalog.filterByGenre(albums,genre.id).sort((a,b)=>(Number(b.review_count)||0)-(Number(a.review_count)||0) || String(a.album_name).localeCompare(String(b.album_name),'es'));
  return <GenreDetail genre={genre} albums={releases} />;
}
