'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import catalog from '../utils/genreCatalog.cjs';
import files from '../utils/genreAssetFiles.cjs';
import { UiIcon } from './UiIcon';
import styles from './AdminVinylCatalog.module.css';

const PAGE_SIZE = 48;
const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const entries = catalog.GENRES.map(genre => ({...genre, search:normalize(`${genre.name} ${genre.id}`)}));
const filename = genre => `musiclub-vinilo-${genre.id.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')}`;

function Downloads({genre}) {
  return <div className={styles.downloads}>
    <a href={files.genreAssetPath(genre.id)} download={`${filename(genre)}.png`} aria-label={`Descargar PNG de ${genre.name}`}><UiIcon name="download" size={18} tone="inherit"/>PNG</a>
    <a href={files.genreSvgAssetPath(genre.id)} download={`${filename(genre)}.svg`} aria-label={`Descargar SVG de ${genre.name}`}><UiIcon name="edit" size={18} tone="inherit"/>SVG</a>
  </div>;
}

function Preview({genre,onClose}) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current, focus = document.activeElement, overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; if(focus?.isConnected) focus.focus(); };
  },[]);
  return createPortal(<dialog ref={dialog} className={styles.dialog} aria-labelledby="admin-vinyl-name" onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div className={styles.preview}>
      <header><div><p>VINILO DEL GÉNERO</p><h2 id="admin-vinyl-name" translate="no">{genre.name}</h2></div><button type="button" autoFocus aria-label="Cerrar vista ampliada" onClick={onClose}><UiIcon name="close" size={22} tone="inherit"/></button></header>
      <div className={styles.previewImage}><img src={files.genreSvgAssetPath(genre.id)} alt={`Vinilo de ${genre.name}`} width="800" height="800"/></div>
      <footer><p>Fondo transparente<span>PNG · 560 × 560 px · SVG editable sin límite de tamaño.</span></p><Downloads genre={genre}/></footer>
    </div>
  </dialog>, document.body);
}

export default function AdminVinylCatalog() {
  const [query,setQuery] = useState(''), [page,setPage] = useState(1), [selected,setSelected] = useState(null);
  const results = useMemo(()=>entries.filter(genre=>genre.search.includes(normalize(query.trim()))),[query]);
  const pages = Math.max(1,Math.ceil(results.length/PAGE_SIZE)), current = Math.min(page,pages);
  const visible = results.slice((current-1)*PAGE_SIZE,current*PAGE_SIZE);
  const changePage = value => {setPage(value);document.getElementById('admin-vinyl-catalog')?.scrollIntoView({block:'start',behavior:'instant'});};
  return <section id="admin-vinyl-catalog" className={styles.catalog} aria-labelledby="admin-vinyl-title">
    <header className={styles.intro}>
      <div><p className={styles.eyebrow}><UiIcon name="disc" size={22} tone="accent"/>ARCHIVO VISUAL</p><h1 id="admin-vinyl-title">Vinilos de géneros</h1><p>Todos los diseños de Musiclub. Amplía un vinilo o descarga su imagen para trabajar en él.</p></div>
      <div className={styles.total}><strong>{entries.length.toLocaleString('es-MX')}</strong><span>diseños</span></div>
    </header>
    <div className={styles.toolbar}>
      <label className={styles.search}><UiIcon name="search" size={22} tone="accent"/><span className={styles.srOnly}>Buscar género de vinilo</span><input type="search" placeholder="Buscar un género…" value={query} onChange={event=>{setQuery(event.target.value);setPage(1);}}/></label>
      <p aria-live="polite">{results.length.toLocaleString('es-MX')} {results.length===1?'diseño':'diseños'}<span>PNG transparente · SVG editable</span></p>
    </div>
    {visible.length ? <ul className={styles.grid} aria-label="Catálogo de vinilos de géneros">{visible.map(genre=><li key={genre.id} className={styles.card}>
      <button type="button" className={styles.artwork} aria-label={`Ampliar vinilo de ${genre.name}`} aria-haspopup="dialog" onClick={()=>setSelected(genre)}><img src={files.genreAssetPath(genre.id)} alt={`Vinilo de ${genre.name}`} width="560" height="560" loading="lazy" decoding="async"/><span><UiIcon name="search" size={18} tone="inherit"/>Ampliar</span></button>
      <h2 translate="no">{genre.name}</h2><Downloads genre={genre}/>
    </li>)}</ul> : <div className={styles.empty}><UiIcon name="search" size={36} tone="accent"/><h2>No encontramos ese género</h2><button type="button" onClick={()=>{setQuery('');setPage(1);}}>Ver todos los vinilos</button></div>}
    {results.length>0 && <nav className={styles.pagination} aria-label="Páginas de vinilos">
      <p>{((current-1)*PAGE_SIZE+1).toLocaleString('es-MX')}–{Math.min(current*PAGE_SIZE,results.length).toLocaleString('es-MX')} de {results.length.toLocaleString('es-MX')}</p>
      <div><button type="button" disabled={current===1} onClick={()=>changePage(current-1)} aria-label="Página anterior de vinilos">←</button><label>Página <select aria-label="Página de vinilos" value={current} onChange={event=>changePage(Number(event.target.value))}>{Array.from({length:pages},(_,index)=><option key={index+1} value={index+1}>{index+1}</option>)}</select> de {pages}</label><button type="button" disabled={current===pages} onClick={()=>changePage(current+1)} aria-label="Página siguiente de vinilos">→</button></div>
    </nav>}
    {selected && <Preview genre={selected} onClose={()=>setSelected(null)}/>}
  </section>;
}
