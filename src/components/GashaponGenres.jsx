'use client';
import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GenreArtwork } from './GenreArtwork';
import catalog from '../utils/genreCatalog.cjs';
import routes from '../utils/genreRoutes.cjs';

const searchable = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function GashaponGenres({ albums = [], value = 'all', onChange, disabled = false }) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const [includeEmpty, setIncludeEmpty] = useState(false);
  const [limit, setLimit] = useState(60);
  const counts = useMemo(() => catalog.genreCounts(albums), [albums]);
  const available = useMemo(() => catalog.GENRES.filter(genre => includeEmpty || counts.has(genre.id))
    .sort((a,b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0) || a.name.localeCompare(b.name)), [counts, includeEmpty]);
  const results = available.filter(genre => searchable(`${genre.name} ${genre.id}`).includes(searchable(search.trim())));
  const compact = available.slice(0, 6);
  const selected = catalog.GENRES.find(genre => genre.id === value);
  if (selected && !compact.some(genre => genre.id === value)) compact[compact.length ? compact.length - 1 : 0] = selected;
  const visible = expanded || search ? results.slice(0, limit) : compact;
  return <fieldset disabled={disabled} className="min-w-0 space-y-4 rounded-2xl border border-white/10 bg-black/25 p-3 sm:p-4">
    <legend className="px-2 text-sm font-extrabold text-white">Elige tu género</legend>
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <button type="button" onClick={() => onChange('all')} aria-pressed={value === 'all'} className={`min-h-11 rounded-xl border px-3 text-xs font-bold transition-colors ${value === 'all' ? 'border-cyan-300/40 bg-cyan-400/15 text-cyan-200' : 'border-white/10 text-white/60 hover:text-white'}`}>Todos los géneros</button>
      <label className="relative min-w-0 flex-1 basis-40" htmlFor={`${id}-search`}>
        <span className="sr-only">Buscar un género para el Gashapon</span>
        <input id={`${id}-search`} type="search" value={search} onChange={event => { setSearch(event.target.value); setLimit(60); }} placeholder="Buscar género…" className="min-h-11 w-full rounded-xl border border-white/15 bg-black/20 px-3 text-sm text-white placeholder:text-white/40 focus-visible:outline-2 focus-visible:outline-cyan-300" />
      </label>
      <button type="button" aria-expanded={expanded} aria-controls={`${id}-genres`} onClick={() => { setExpanded(open => !open); setSearch(''); setLimit(60); }} className="min-h-11 px-1 text-xs font-bold text-white/60 hover:text-white">{expanded ? 'Ver menos ↑' : `Ver todos (${counts.size}) ↓`}</button>
    </div>
    <div id={`${id}-genres`} role="group" aria-label="Filtrar Gashapon por género" className={`grid grid-cols-3 gap-2 lg:grid-cols-6 ${expanded || search ? 'max-h-96 overflow-y-auto overscroll-contain p-1' : ''}`}>
      {visible.map(genre => <button key={genre.id} type="button" aria-pressed={value === genre.id} aria-label={`Filtrar Gashapon por ${genre.name}`} onClick={() => onChange(genre.id)} className={`group flex min-w-0 flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${value === genre.id ? 'border-pink-300/50 bg-linear-to-br from-pink-400/15 to-purple-400/15' : 'border-white/5 bg-white/5 hover:border-white/25 hover:bg-white/10'}`}>
        <GenreArtwork genre={genre.id} size={80} animated={value === genre.id} className="h-16 w-16 shrink-0 transition-transform group-hover:scale-105 sm:h-20 sm:w-20" />
        <span translate="no" className="wrap-anywhere text-xs font-bold leading-snug text-white">{genre.name}</span>
        <span className="text-[10px] text-white/45">{counts.get(genre.id) || 0} disponibles</span>
      </button>)}
    </div>
    {!visible.length && <p role="status" className="text-xs text-white/50">No hay coincidencias. Puedes incluir géneros sin lanzamientos en «Ver todos».</p>}
    {(expanded || search) && results.length > limit && <button type="button" onClick={() => setLimit(number => number + 60)} className="min-h-11 text-xs font-bold text-cyan-300">Mostrar más géneros ↓</button>}
    {expanded && <label className="flex min-h-11 items-center gap-2 text-xs text-white/50"><input type="checkbox" checked={includeEmpty} onChange={event => { setIncludeEmpty(event.target.checked); setLimit(60); }} />Incluir géneros sin lanzamientos</label>}
    {selected && <Link to={routes.genrePath(value)} className="inline-flex min-h-11 items-center text-xs font-bold text-cyan-300 hover:text-white">Ver la página de {selected.name} →</Link>}
  </fieldset>;
}
