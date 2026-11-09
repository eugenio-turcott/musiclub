import { useId, useMemo, useState } from 'react';
import { UiIcon } from './UiIcon';
import catalog from '../utils/genreCatalog.cjs';

const fold = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function SearchSelectionNotice({ message, busy, pending, onConfirm, onCancel }) {
  const id = useId();
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const options = useMemo(() => {
    const matches = catalog.GENRES.filter(item => fold(item.name).includes(fold(search))).slice(0, 60);
    const selected = catalog.GENRES.find(item => item.id === genre);
    return selected && !matches.includes(selected) ? [selected, ...matches] : matches;
  }, [search, genre]);
  if (!message && !pending) return null;
  return <div className="mx-3 my-2 shrink-0 rounded-xl border border-amber-300/20 bg-slate-950/95 p-3 text-xs text-slate-200">
    {message && <div role={busy ? 'status' : 'alert'} className="flex items-start gap-2">
      <UiIcon name={busy ? 'cycle' : 'info'} size={20} className={busy ? 'motion-safe:animate-spin' : ''} />
      <span>{message}</span>
    </div>}
    {pending && <form aria-label="Completar género del release" className="space-y-3" onSubmit={event => { event.preventDefault(); const selected = catalog.GENRES.find(item => item.id === genre); if (selected) onConfirm(selected.name); }}>
      <div className="flex items-start gap-2"><UiIcon name="tag" size={24}/><div><strong className="block text-amber-200">Falta el género de este release</strong><p className="mt-1 text-slate-400"><span translate="no">{pending.payload.albumName}</span> llegó sin género. Elige uno para continuar.</p></div></div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div><label htmlFor={`${id}-search`}>Buscar género</label><input id={`${id}-search`} type="search" value={search} onChange={event => setSearch(event.target.value)} disabled={busy} placeholder="R&B, hip-hop, rock…" className="mt-1 min-h-11 w-full rounded-lg border border-white/15 bg-slate-900 px-3 text-white"/></div>
        <div><label htmlFor={`${id}-genre`}>Género del release</label><select id={`${id}-genre`} value={genre} onChange={event => setGenre(event.target.value)} disabled={busy} required className="mt-1 min-h-11 w-full rounded-lg border border-white/15 bg-slate-900 px-2 text-white"><option value="">Selecciona un género</option>{options.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      </div>
      {!options.length && <p role="status" className="text-amber-200">No hay géneros con ese nombre. Prueba otro término.</p>}
      <div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={busy} onClick={onCancel} className="min-h-10 rounded-lg px-3 text-slate-300 hover:text-pink-300">Cancelar</button><button type="submit" disabled={busy || !genre} className="min-h-10 rounded-lg bg-pink-400 px-4 font-bold text-slate-950 disabled:opacity-40">{busy ? 'Guardando…' : 'Continuar al release'}</button></div>
    </form>}
  </div>;
}
