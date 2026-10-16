'use client';
import { participationMetrics } from '../utils/participationMetrics';
export function ParticipationMetrics({ reviews }) {
  const stats = participationMetrics(reviews);
  return <section className="rounded-2xl border border-white/15 bg-black/30 p-5 text-white">
    <h2 className="text-xl font-bold">Participación en los últimos 30 días</h2>
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-4">{[
      ['Reseñas publicadas', stats.recentReviews], ['Personas que reseñaron', stats.active],
      ['Primeras reseñas', stats.firstTime], ['Personas que volvieron', stats.returned],
    ].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-300">{label}</dt><dd className="text-2xl font-bold">{value}</dd></div>)}</dl>
    <p className="text-xs text-slate-300">Calculado con las reseñas guardadas. «Volvieron» cuenta a quienes ya habían reseñado antes de estos 30 días y publicaron de nuevo. Borrar reseñas puede cambiar estos totales. No se envían identidades a Vercel.</p>
    <p className="text-xs text-slate-300 mt-2">Consulta las visitas y el origen del tráfico en Vercel → Analytics. Estas cifras describen participación; no representan una tasa de conversión de visitantes.</p>
  </section>;
}
