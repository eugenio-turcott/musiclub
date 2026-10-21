import Link from 'next/link';
import { Footer } from './Footer';

export function InformationPage({ title, intro, children }) {
  return <div className="min-h-screen cyber-grid p-4 sm:p-8"><div className="mx-auto max-w-4xl">
    <nav aria-label="Navegación" className="mb-8 flex flex-wrap gap-4 text-sm text-pink-200"><Link href="/">← Musiclub</Link><Link href="/reviews">Reseñas del club</Link><Link href="/sobre-musiclub">Sobre Musiclub</Link><Link href="/contacto">Contacto</Link></nav>
    <main className="rounded-3xl border border-white/10 bg-[#101222]/95 p-5 sm:p-10"><header className="mb-8"><p className="text-xs font-bold uppercase tracking-widest text-pink-300">Musiclub · Comunidad de escucha</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">{title}</h1><p className="mt-4 leading-relaxed text-slate-300">{intro}</p></header><div className="space-y-8 text-sm leading-7 text-slate-300">{children}</div></main>
    <Footer />
  </div></div>;
}
