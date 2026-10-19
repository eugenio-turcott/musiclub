'use client';
import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { GenreArtwork } from './GenreArtwork';
import { MusiclubVinyl } from './MusiclubVinyl';
import presentation from '../utils/poolPresentation.cjs';
import genres from '../utils/genreCatalog.cjs';

export function PoolAppearanceFields({ value, onChange, onUploadingChange = () => {} }) {
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
      <label>Título de la cabecera<input maxLength={100} value={a.heading} placeholder="Pool Musical Comunitario" onChange={e=>change('heading',e.target.value)} className={input} /></label>
      <label>Fondo<select value={a.mode} onChange={e=>change('mode',e.target.value)} className={input}><option value="gradient">Degradado</option><option value="solid">Color sólido</option></select></label>
      <label>Color principal<input type="color" value={a.colorA} onChange={e=>change('colorA',e.target.value)} className={`${input} cursor-pointer`} /></label>
      {a.mode === 'gradient' && <label>Segundo color<input type="color" value={a.colorB} onChange={e=>change('colorB',e.target.value)} className={`${input} cursor-pointer`} /></label>}
      <label className="sm:col-span-2">Presentación breve<textarea rows={2} maxLength={600} value={a.intro} onChange={e=>change('intro',e.target.value)} placeholder="Cuenta de qué se trata este Pool" className={input} /></label>
      <label>Vinilo de fondo<select value={a.vinyl} onChange={e=>change('vinyl',e.target.value)} className={input}><option value="brand">Musiclub</option><option value="genre">Vinilo de un género</option><option value="none">Sin vinilo</option></select></label>
      {a.vinyl === 'brand' && <label>Edición Musiclub<select value={a.logo} onChange={e=>change('logo',e.target.value)} className={input}>{['/musiclub_logo.png','/musiclub_logo_2.png','/musiclub_logo_3.png','/musiclub_logo_4.png'].map((logo,i)=><option key={logo} value={logo}>Edición {i+1}</option>)}</select></label>}
      {a.vinyl === 'genre' && <label>Género del vinilo<select value={a.genre} onChange={e=>change('genre',e.target.value)} className={input}>{genres.GENRES.map(g=><option key={g.id} value={g.name}>{g.name}</option>)}</select></label>}
      <label className="sm:col-span-2">Imagen o GIF (enlace HTTPS, opcional)<input type="url" maxLength={2000} value={value?.mediaUrl || ''} onChange={e=>onChange({...a,mediaUrl:e.target.value})} placeholder="https://…" className={input} /></label>
      <label className="sm:col-span-2">O sube una imagen / GIF · máximo 8 MB<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={upload} className={`${input} file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-purple-500/20 file:p-2 file:text-purple-200`} /></label>
      {uploading && <p role="status">Subiendo imagen…</p>}{error && <p role="alert" className="text-rose-300 sm:col-span-2">{error}</p>}
      <div className="relative min-h-36 overflow-hidden rounded-2xl border border-white/15 p-5 sm:col-span-2" style={{background:presentation.poolBackground(a)}} aria-label="Vista previa de la cabecera">
        {a.mediaUrl && <img src={a.mediaUrl} alt="" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-30" />}
        <div className="absolute -right-6 -bottom-10 h-44 w-44 opacity-30">{a.vinyl === 'brand' ? <MusiclubVinyl src={a.logo} alt="" className="h-full w-full"/> : a.vinyl === 'genre' ? <GenreArtwork genre={a.genre} size={176} animated/> : null}</div>
        <div className="relative max-w-[75%]"><span className="text-[10px] font-bold text-pink-200">VISTA PREVIA</span><p className="mt-2 text-lg font-black text-white">{a.heading || 'Pool Musical Comunitario'}</p><p className="mt-2 text-slate-200">{a.intro || 'Una nueva dinámica para descubrir música juntos.'}</p></div>
      </div>
    </div>
  </details>;
}
