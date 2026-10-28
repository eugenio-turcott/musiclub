import Link from 'next/link';
import { InformationPage } from '../../../components/InformationPage';
import { notFound } from 'next/navigation';
import { MUSIC_GUIDES } from '../../../data/musicGuides';
import { jsonLd } from '../../../utils/publicData';
export function generateStaticParams() { return MUSIC_GUIDES.map(g => ({ slug: g.slug })); }
export async function generateMetadata({ params }) { const { slug } = await params; const guide = MUSIC_GUIDES.find(g => g.slug === slug); if (!guide) notFound(); return { title: guide.title, description: guide.description, alternates: { canonical: `https://www.musiclub.org/guias/${slug}` } }; }
export default async function GuidePage({ params }) {
  const { slug } = await params; const guide = MUSIC_GUIDES.find(g => g.slug === slug); if (!guide) notFound();
  return <InformationPage title={guide.title} intro={guide.description}>
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400"><Link href="/guias" className="font-bold text-pink-300">← Guías de Musiclub</Link><span>Actualizada el {new Date(`${guide.updatedAt || '2026-10-16'}T12:00:00Z`).toLocaleDateString('es-MX', {day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})}</span></div>
    {guide.sections.map(([title,text])=><section key={title}><h2>{title}</h2><p className="mt-3">{text}</p></section>)}
    <Link className="inline-flex min-h-12 w-fit items-center rounded-xl bg-pink-500/15 px-5 py-3 font-bold text-pink-200" href="/catalogo">Explorar el catálogo</Link>
    <nav aria-label="Más guías" className="flex flex-wrap gap-4 text-sm text-purple-200">{MUSIC_GUIDES.filter(item=>item.slug!==slug).map(item=><Link className="underline" key={item.slug} href={`/guias/${item.slug}`}>{item.title}</Link>)}</nav>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd({'@context':'https://schema.org','@type':'Article',headline:guide.title,description:guide.description,author:{'@type':'Organization',name:'Musiclub'},datePublished:'2026-10-16',dateModified:guide.updatedAt || '2026-10-16',mainEntityOfPage:`https://www.musiclub.org/guias/${slug}`})}}/>
  </InformationPage>;
}
