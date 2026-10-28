'use client';
import { useState, useEffect } from 'react';
import { PoolAppearanceFields } from './PoolAppearanceFields';
import { PoolCapsulePreview } from './PoolCapsuleDeposit';
import presentation from '../utils/poolPresentation.cjs';
import { POOL_THEMES } from '../data/poolThemes';

export function PoolManualControls({ season, seasons, user, sampleRelease, isPoolOpen, createSeason, updateSeason, setActiveSeason, setPoolOpenStatus, onError, canUpload = true }) {
  const [uploading, setUploading] = useState(false);
  const [maxReleases, setMaxReleases] = useState('');
  const [appearance, setAppearance] = useState(presentation.DEFAULT_APPEARANCE);
  const [currentMax, setCurrentMax] = useState('');
  const [currentAppearance, setCurrentAppearance] = useState(presentation.DEFAULT_APPEARANCE);
  const appearanceKey = JSON.stringify(season.appearance || {});
  useEffect(() => { setCurrentMax(season.max_releases ?? ''); setCurrentAppearance(presentation.poolAppearance(season.appearance)); }, [season.id, season.max_releases, appearanceKey]);
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
      <PoolCapsulePreview release={sampleRelease} user={user}/>
      <button disabled={busy || uploading} onClick={() => run(() => setPoolOpenStatus(season.is_open !== true))} className="min-h-11 rounded-xl border border-pink-300/30 bg-pink-500/15 px-4 font-bold text-pink-200">{season.is_open === true ? 'Cerrar propuestas para todos' : 'Abrir propuestas para todos'}</button>
      <div className="flex flex-wrap items-end gap-3 border-t border-white/10 pt-4">
        <label className="min-w-0 flex-1 text-xs text-slate-300">Cambiar de Pool
          <select aria-label="Pool que quieres activar" value={selected || season.id} onChange={e => setSelected(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-[#111424] p-2 text-white">{seasons.map(item => <option key={item.id} value={item.id}>{item.name}{item.is_active ? ' · Activo' : ''}</option>)}</select>
        </label>
        <button disabled={busy || uploading || !selected || selected === season.id} onClick={() => run(async () => { await setActiveSeason(selected); setNotice('Pool activado. Las propuestas siguen bajo tu control manual.'); })} className="min-h-11 rounded-xl bg-cyan-500/15 px-4 text-xs font-bold text-cyan-200">Activar Pool seleccionado</button>
      </div>
      <details className="rounded-xl border border-white/10 p-3"><summary className="font-bold text-cyan-200">Personalizar el Pool actual y su cupo</summary>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={event=>{event.preventDefault(); run(async()=>{ await updateSeason(season.id,{max_releases:currentMax === '' ? null : Number(currentMax), appearance:presentation.poolAppearance(currentAppearance)}); setNotice('Cupo y diseño del Pool actual guardados.'); });}}>
          <label className="text-xs text-slate-300 sm:col-span-2">Cupo total de releases (vacío = sin límite)<input type="number" min={Math.max(1,season.entry_count || 0)} max={1000} value={currentMax} onChange={e=>setCurrentMax(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-[#111424] p-2 text-white" placeholder="Sin límite" /></label>
          <PoolAppearanceFields value={currentAppearance} name={season.name} description={season.description} onChange={setCurrentAppearance} onUploadingChange={setUploading} canUpload={canUpload}/>
          <button disabled={busy || uploading} className="min-h-11 rounded-xl bg-cyan-500/15 px-4 text-xs font-bold text-cyan-200 sm:col-span-2">Guardar cupo y diseño actual</button>
        </form>
      </details>
      <form className="grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); run(async () => {
        const next = Math.max(0, ...seasons.map(item => Number(item.season_number) || 0)) + 1;
        const created = await createSeason({ season_number: next, name: name.trim(), description: description.trim(), max_releases: maxReleases === '' ? null : Number(maxReleases), appearance: presentation.poolAppearance(appearance), is_active: false });
        setSelected(created.id); setNotice('Pool creado y cerrado. Actívalo cuando el club elija la dinámica.');
      }); }}>
        <label className="text-xs text-slate-300 sm:col-span-2">Inspiración para el siguiente Pool
          <select value={theme} onChange={event => { const id = event.target.value; setTheme(id); const idea = POOL_THEMES.find(item => item.id === id); if (idea) { setName(idea.title); setDescription(`${idea.rule}\n\nJuego del turno: ${idea.game}`); } }} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-[#111424] p-2 text-white"><option value="">Dinámica personalizada</option>{POOL_THEMES.map(idea => <option key={idea.id} value={idea.id}>{idea.title}</option>)}</select>
        </label>
        <label className="text-xs text-slate-300 sm:col-span-2">Nombre del nuevo Pool<input required maxLength={120} value={name} onChange={e => setName(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-white" /></label>
        <label className="text-xs text-slate-300 sm:col-span-2">Dinámica y reglas<textarea required rows={4} maxLength={1800} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full rounded-xl border border-white/15 bg-black/25 p-3 text-white" /></label>
        <label className="text-xs text-slate-300 sm:col-span-2">Cupo total de releases (opcional)<input type="number" min={1} max={1000} value={maxReleases} onChange={e=>setMaxReleases(e.target.value)} placeholder="Sin límite" className="mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-[#111424] p-2 text-white"/><span className="mt-1 block text-slate-400">Los primeros registros válidos ocupan los lugares. Graduar un disco no libera su lugar.</span></label>
        <PoolAppearanceFields value={appearance} name={name} description={description} onChange={setAppearance} onUploadingChange={setUploading} canUpload={canUpload}/>
        <button disabled={busy || uploading || !name.trim() || !description.trim()} className="min-h-11 rounded-xl bg-linear-to-r from-pink-500 to-purple-500 px-4 text-xs font-bold text-white sm:col-span-2">{busy ? 'Guardando…' : 'Crear nuevo Pool cerrado'}</button>
      </form>
      {notice && <p role="status" className="text-xs text-emerald-300">{notice}</p>}
    </div>
  </details>;
}
