'use client';
import { useState } from 'react';
import { POOL_THEMES } from '../data/poolThemes';

export function PoolManualControls({ season, seasons, isPoolOpen, createSeason, setActiveSeason, setPoolOpenStatus, onError }) {
  const [theme, setTheme] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const run = async action => {
    setBusy(true); setNotice('');
    try { await action(); } catch (error) { onError(error.message); } finally { setBusy(false); }
  };
  return <details className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
    <summary className="font-bold text-pink-200">Administrar Pool · control manual</summary>
    <div className="mt-4 space-y-5">
      <p className="text-xs text-slate-400">Abrir o cerrar propuestas no cambia las reseñas. Las reseñas se habilitan, pausan o cierran desde el disco ganador.</p>
      <button disabled={busy} onClick={() => run(() => setPoolOpenStatus(!isPoolOpen))} className="min-h-11 rounded-xl border border-pink-300/30 bg-pink-500/15 px-4 font-bold text-pink-200">{isPoolOpen ? 'Cerrar propuestas para todos' : 'Abrir propuestas para todos'}</button>
      <div className="flex flex-wrap items-end gap-3 border-t border-white/10 pt-4">
        <label className="min-w-0 flex-1 text-xs text-slate-300">Cambiar de Pool
          <select aria-label="Pool que quieres activar" value={selected || season.id} onChange={e => setSelected(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-[#111424] p-2 text-white">{seasons.map(item => <option key={item.id} value={item.id}>{item.name}{item.is_active ? ' · Activo' : ''}</option>)}</select>
        </label>
        <button disabled={busy || !selected || selected === season.id} onClick={() => run(async () => { await setActiveSeason(selected); setNotice('Pool activado. Las propuestas siguen bajo tu control manual.'); })} className="min-h-11 rounded-xl bg-cyan-500/15 px-4 text-xs font-bold text-cyan-200">Activar Pool seleccionado</button>
      </div>
      <form className="grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); run(async () => {
        const next = Math.max(0, ...seasons.map(item => Number(item.season_number) || 0)) + 1;
        const created = await createSeason({ season_number: next, name: name.trim(), description: description.trim(), is_active: false });
        setSelected(created.id); setNotice('Pool creado y cerrado. Actívalo cuando el club elija la dinámica.');
      }); }}>
        <label className="text-xs text-slate-300 sm:col-span-2">Inspiración para el siguiente Pool
          <select value={theme} onChange={event => { const id = event.target.value; setTheme(id); const idea = POOL_THEMES.find(item => item.id === id); if (idea) { setName(idea.title); setDescription(`${idea.rule}\n\nJuego del turno: ${idea.game}`); } }} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-[#111424] p-2 text-white"><option value="">Dinámica personalizada</option>{POOL_THEMES.map(idea => <option key={idea.id} value={idea.id}>{idea.icon} {idea.title}</option>)}</select>
        </label>
        <label className="text-xs text-slate-300 sm:col-span-2">Nombre del nuevo Pool<input required maxLength={120} value={name} onChange={e => setName(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-white" /></label>
        <label className="text-xs text-slate-300 sm:col-span-2">Dinámica y reglas<textarea required rows={4} maxLength={1800} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-white" /></label>
        <button disabled={busy || !name.trim() || !description.trim()} className="min-h-11 rounded-xl bg-linear-to-r from-pink-500 to-purple-500 px-4 text-xs font-bold text-white sm:col-span-2">{busy ? 'Guardando…' : 'Crear nuevo Pool cerrado'}</button>
      </form>
      {notice && <p role="status" className="text-xs text-emerald-300">{notice}</p>}
    </div>
  </details>;
}
