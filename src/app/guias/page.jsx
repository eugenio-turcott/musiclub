import Link from 'next/link';
import { MUSIC_GUIDES } from '../../data/musicGuides';
export const metadata = { title: 'Guías para escuchar y reseñar discos', description: 'Aprende a valorar discos, interpretar las notas del club y descubrir música en comunidad.', alternates: { canonical: 'https://www.musiclub.org/guias' } };
export default function GuidesPage() {
  return <main className="max-w-4xl mx-auto p-6 sm:p-12 space-y-6"><Link href="/">← Musiclub</Link><h1 className="text-4xl font-bold">Escucha, opina y descubre</h1><p className="text-slate-300">Guías de Musiclub para empezar y entender las valoraciones de la comunidad.</p>{MUSIC_GUIDES.map(g => <article key={g.slug} className="rounded-2xl border border-white/20 p-5"><h2 className="text-2xl font-bold"><Link href={`/guias/${g.slug}`} className="underline">{g.title}</Link></h2><p className="mt-3 text-slate-300">{g.description}</p></article>)}<Link href="/catalogo" className="inline-block rounded-xl bg-pink-600 p-3 font-bold">Buscar un disco para escuchar</Link></main>;
}
