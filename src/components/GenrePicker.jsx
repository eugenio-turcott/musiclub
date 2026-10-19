'use client';
import { useId, useMemo, useState } from 'react';
import catalog from '../utils/genreCatalog.cjs';

const searchable = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function GenrePicker({ albums = [], value = 'all', onChange, disabled = false }) {
  const id = useId();
  const [search, setSearch] = useState('');
  const [includeEmpty, setIncludeEmpty] = useState(false);
  const counts = useMemo(() => catalog.genreCounts(albums), [albums]);
  const options = useMemo(() => catalog.GENRES.filter(genre => genre.id === value ||
    ((includeEmpty || counts.has(genre.id)) && searchable(`${genre.name} ${genre.id}`).includes(searchable(search)))), [value, includeEmpty, search, counts]);
  return <fieldset disabled={disabled} className="min-w-0 rounded-2xl border border-purple-300/25 bg-black/25 p-4 space-y-3">
    <legend className="px-2 font-bold text-purple-200">Explorar por género</legend>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm text-slate-200" htmlFor={`${id}-search`}>Buscar un género
        <input id={`${id}-search`} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Rock, jazz, cumbia, shoegaze…" className="mt-1 min-h-11 w-full rounded-xl border border-white/20 bg-slate-950 p-3 text-white" />
      </label>
      <label className="text-sm text-slate-200" htmlFor={`${id}-select`}>Género musical
        <select id={`${id}-select`} translate="no" value={value} onChange={event => onChange(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/20 bg-slate-950 p-3 text-white">
          <option value="all">Todos los géneros</option>
          {options.map(genre => <option key={genre.id} value={genre.id}>{genre.name} ({counts.get(genre.id) || 0})</option>)}
        </select>
      </label>
    </div>
    <label className="flex min-h-11 items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={includeEmpty} onChange={event => setIncludeEmpty(event.target.checked)} />Mostrar también géneros sin lanzamientos en el club</label>
    <p className="text-xs text-slate-400">{counts.size} géneros con lanzamientos · {catalog.GENRES.length.toLocaleString('es-ES')} géneros y categorías disponibles. El catálogo se puede ampliar.</p>
    {search && !options.length && <p role="status" className="text-sm text-amber-200">No hay coincidencias. Puedes incluir los géneros que aún no tienen lanzamientos.</p>}
  </fieldset>;
}
