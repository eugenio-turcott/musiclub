'use client';
import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { PoolHero } from './PoolHero';
import presentation from '../utils/poolPresentation.cjs';
import genres from '../utils/genreCatalog.cjs';

export function PoolAppearanceFields({ value, name = '', description = '', onChange, onUploadingChange = () => {}, canUpload = true }) {
  const a = presentation.poolAppearance(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const input = 'mt-1 min-h-11 w-full rounded-xl border border-white/15 bg-[#111424] p-2 text-white';
  const change = (key, val) => onChange({ ...a, [key]: val });
  const upload = async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(''); setUploading(true); onUploadingChange(true);
    try {
      const extensions = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/gif':'gif' };
      if (!extensions[file.type] || file.size > 8 * 1024 * 1024) throw new Error('Elige una imagen PNG, JPG, WebP o GIF de hasta 8 MB.');
      const path = `design/${crypto.randomUUID()}.${extensions[file.type]}`;
      const { error: uploadError } = await supabase.storage.from('pool-media').upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error('No se pudo subir la imagen. Inténtalo nuevamente.');
      change('mediaUrl', supabase.storage.from('pool-media').getPublicUrl(path).data.publicUrl);
    } catch (err) { setError(err.message); } finally { setUploading(false); onUploadingChange(false); event.target.value = ''; }
  };
  return <details className="rounded-xl border border-white/10 p-3 sm:col-span-2">
    <summary className="font-bold text-purple-200">Colores, vinilo e imagen del Pool</summary>
    <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2 text-xs text-slate-300">
      <div className="sm:col-span-2"><span className="mb-2 block">Paletas para empezar</span><div className="flex flex-wrap gap-2">{[
        ['Musiclub','#161832','#070812'],['Rojo','#581429','#b73148'],['Azul','#10244e','#155e91'],['Verde','#143d32','#668622'],['Atardecer','#48215f','#b94436']
      ].map(([name,colorA,colorB])=><button type="button" key={name} aria-label={`Paleta ${name}`} onClick={()=>onChange({...a,colorA,colorB})} className="flex min-h-10 items-center gap-2 rounded-xl border border-white/15 px-3 text-[11px] font-bold hover:border-pink-300"><span className="h-5 w-5 rounded-full border border-white/25" style={{background:`linear-gradient(135deg,${colorA},${colorB})`}}/>{name}</button>)}</div></div>
      <label>Título visible (opcional)<input maxLength={100} value={a.heading} placeholder={name || "Se usa el nombre del Pool"} onChange={e=>change('heading',e.target.value)} className={input} /></label>
      <label>Fondo<select value={a.mode} onChange={e=>change('mode',e.target.value)} className={input}><option value="gradient">Degradado</option><option value="solid">Color sólido</option></select></label>
      <label>Color principal<input type="color" value={a.colorA} onInput={e=>change('colorA',e.target.value)} onChange={e=>change('colorA',e.target.value)} className={`${input} cursor-pointer`} /></label>
      {a.mode === 'gradient' && <label>Segundo color<input type="color" value={a.colorB} onInput={e=>change('colorB',e.target.value)} onChange={e=>change('colorB',e.target.value)} className={`${input} cursor-pointer`} /></label>}
      <label className="sm:col-span-2">Presentación breve<textarea rows={2} maxLength={600} value={a.intro} onChange={e=>change('intro',e.target.value)} placeholder="Cuenta de qué se trata este Pool" className={input} /></label>
      <label>Vinilo de fondo<select value={a.vinyl} onChange={e=>change('vinyl',e.target.value)} className={input}><option value="brand">Musiclub</option><option value="genre">Vinilo de un género</option><option value="none">Sin vinilo</option></select></label>
      {a.vinyl === 'brand' && <label>Edición Musiclub<select value={a.logo} onChange={e=>change('logo',e.target.value)} className={input}>{['/musiclub_logo.png','/musiclub_logo_2.png','/musiclub_logo_3.png','/musiclub_logo_4.png'].map((logo,i)=><option key={logo} value={logo}>Edición {i+1}</option>)}</select></label>}
      {a.vinyl === 'genre' && <label>Género del vinilo<select value={a.genre} onChange={e=>change('genre',e.target.value)} className={input}>{genres.GENRES.map(g=><option key={g.id} value={g.name}>{g.name}</option>)}</select></label>}
      <label className="sm:col-span-2">Imagen o GIF (enlace HTTPS, opcional)<input type="url" maxLength={2000} value={value?.mediaUrl || ''} onChange={e=>onChange({...a,mediaUrl:e.target.value})} placeholder="https://…" className={input} /></label>
      {a.mediaUrl && <label>Tamaño del detalle visual<select value={a.mediaSize} onChange={e=>change('mediaSize',Number(e.target.value))} className={input}><option value={96}>Pequeño</option><option value={128}>Mediano</option><option value={176}>Grande</option></select><span className="mt-1 block text-slate-400">En móvil siempre se adapta a un detalle de 80 px. La imagen se muestra completa.</span></label>}
      {a.mediaUrl && <button type="button" onClick={()=>change('mediaUrl','')} className="min-h-11 self-end rounded-xl border border-white/15 text-slate-300 hover:bg-white/5">Quitar imagen o GIF</button>}
      {canUpload ? <label className="sm:col-span-2">O sube una imagen / GIF · máximo 8 MB<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={upload} className={`${input} file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-purple-500/20 file:p-2 file:text-purple-200`} /></label> : <p className="sm:col-span-2 text-slate-400">Puedes usar una imagen pública por enlace para el diseño de esta sala.</p>}
      {uploading && <p role="status">Subiendo imagen…</p>}{error && <p role="alert" className="text-rose-300 sm:col-span-2">{error}</p>}
      <div className="min-w-0 sm:col-span-2"><span className="mb-2 block text-[10px] font-bold text-pink-200">ASÍ SE VERÁ · el nombre aparece una sola vez</span><PoolHero preview season={{name,description,appearance:a}} /></div>
    </div>
  </details>;
}
