'use client';
import React, { useState } from 'react';
import { GenreArtwork } from './GenreArtwork';

// Reuses the original recommendation panels, borders and spacing.
export function RecommendationGenres({ genres, personalized, selected, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const query = search.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  const visible = expanded ? genres.filter(genre => genre.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').includes(query)) : genres.slice(0, 6);
  const current = genres.find(genre => genre.id === selected);
  return <section aria-labelledby="recommendation-genres-title" className="min-w-0 space-y-3 rounded-2xl border border-white/10 bg-black/40 p-3 sm:p-4">
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <h2 id="recommendation-genres-title" className="text-sm font-extrabold text-white">{personalized ? 'Tus géneros' : 'Explora por género'}</h2>
      <div className="flex flex-wrap items-center gap-3">
        {current && <button onClick={() => onSelect('all')} className="min-h-11 text-xs font-bold text-cyan-300 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300">Quitar filtro: <span translate="no">{current.name}</span> ×</button>}
        {genres.length > 6 && <button aria-expanded={expanded} aria-controls="recommendation-genre-options" onClick={() => { setExpanded(value => !value); setSearch(''); }} className="min-h-11 text-xs font-bold text-white/60 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-300">{expanded ? 'Ver menos' : `Ver todos (${genres.length})`} <span aria-hidden="true">{expanded ? '↑' : '↓'}</span></button>}
      </div>
    </div>
    {expanded && genres.length > 12 && <input type="search" value={search} onChange={event => setSearch(event.target.value)} aria-label="Buscar un género para filtrar recomendaciones" placeholder="Buscar género" className="min-h-11 w-full rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-white placeholder:text-white/40 focus-visible:outline-2 focus-visible:outline-cyan-300 sm:max-w-xs" />}
    <div id="recommendation-genre-options" role="group" aria-label="Filtrar recomendaciones por género" className={`grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-6 ${expanded ? 'max-h-80 overflow-y-auto overscroll-contain p-1' : ''}`}>
      {visible.map(genre => <button key={genre.id} onClick={() => onSelect(selected === genre.id ? 'all' : genre.id)} aria-label={`Filtrar recomendaciones por ${genre.name}`} aria-pressed={selected === genre.id} className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl border p-2 text-center transition-colors sm:flex-row sm:gap-2 sm:text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${selected === genre.id ? 'border-[#f093fb]/60 bg-linear-to-br from-[#f5576c]/15 to-[#f093fb]/15' : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'}`}>
        <GenreArtwork genre={genre.id} size={40} className="h-10 w-10 shrink-0" />
        <span className="min-w-0"><span translate="no" className="block wrap-anywhere text-xs font-bold leading-snug text-white">{genre.name}</span><span className="mt-0.5 block text-[10px] leading-snug text-white/45">{genre.count} {personalized ? 'escuchados' : 'disponibles'}</span></span>
      </button>)}
    </div>
    {!visible.length && <p role="status" className="py-2 text-xs text-white/50">No hay géneros con ese nombre en esta selección.</p>}
  </section>;
}
