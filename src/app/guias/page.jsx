import Link from 'next/link';
import { InformationPage } from '../../components/InformationPage';
import { MUSIC_GUIDES } from '../../data/musicGuides';
export const metadata = { title: 'Guías para escuchar y reseñar discos', description: 'Aprende a valorar discos, interpretar las notas del club y descubrir música en comunidad.', alternates: { canonical: 'https://www.musiclub.org/guias' } };
export default function GuidesPage() {
  return <InformationPage title="Escucha, opina y descubre" intro="Lecturas para desarrollar tu escucha, escribir sobre un disco y entender las valoraciones del club.">
    <Link href="/faq" className="inline-block text-sm font-bold text-pink-300 underline">Ayuda para usar Musiclub →</Link>
    {MUSIC_GUIDES.map((guide,index) => <article key={guide.slug}><p className="mb-3 text-xs font-bold text-purple-300">GUÍA {String(index+1).padStart(2,'0')}</p><h2><Link href={`/guias/${guide.slug}`}>{guide.title}</Link></h2><p className="mt-3">{guide.description}</p><Link href={`/guias/${guide.slug}`} className="mt-5 inline-flex min-h-11 items-center text-sm font-bold text-pink-300">Leer la guía →</Link></article>)}
    <Link href="/catalogo" className="inline-flex min-h-12 w-fit items-center rounded-xl border border-pink-300/25 bg-pink-500/15 px-5 py-3 text-sm font-bold text-pink-200">Buscar un disco para escuchar</Link>
  </InformationPage>;
}
