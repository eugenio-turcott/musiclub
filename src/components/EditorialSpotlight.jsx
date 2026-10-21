'use client';
import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import picks from '../data/editorialSpotlights.json';
import editorial from '../utils/editorialSpotlights.cjs';
import { getReleaseUrl } from '../utils/ratingUtils';
import styles from './EditorialSpotlight.module.css';

export function EditorialSpotlight() {
  const [selected,setSelected]=useState(picks[0]?.id);
  const entries=editorial.activeSpotlights(picks),id=useId();
  if(!entries.length)return null;
  const current=entries.find(entry=>entry.id===selected)||entries[0];
  return <section aria-labelledby={`${id}-title`} className={styles.section}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>SELECCIÓN DE LOS ADMINS DE MUSICLUB</p><h2 id={`${id}-title`}>En el radar.</h2></div><p>Tres miradas. Tu próxima obsesión musical.</p></header>
    <div role="tablist" aria-label="Destacados de Musiclub" className={styles.tabs}>{entries.map((entry,index)=><button key={entry.id} type="button" role="tab" id={`${id}-${entry.id}`} aria-selected={current.id===entry.id} aria-controls={`${id}-panel`} onClick={()=>setSelected(entry.id)} className={`${styles.tab} ${current.id===entry.id?styles.selected:''}`}><span aria-hidden="true">0{index+1}</span>{entry.category}</button>)}</div>
    <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${current.id}`} className={`${styles.billboard} ${styles[current.tone]}`}>
      {current.placement==='sponsored'&&<span className={styles.sponsored}>Patrocinado</span>}
      <Link to={getReleaseUrl({album_name:current.release,artist_name:current.artist,release_type:'ALBUM'})} className={styles.artLink} aria-label={`Descubrir ${current.release} de ${current.artist}`}>
        <img src={current.artwork} width="1600" height="640" loading="lazy" decoding="async" alt="" className={styles.artwork}/>
        <span className={styles.srOnly}>{current.category}: {current.artist} — {current.release}</span>
      </Link>
      <div className={styles.caption}><div><h3 translate="no">{current.artist}</h3><p translate="no">{current.release}</p></div><Link to={getReleaseUrl({album_name:current.release,artist_name:current.artist,release_type:'ALBUM'})} aria-label={`Ver el release ${current.release}`}>Ver release <span aria-hidden="true">↗</span></Link></div>
      {current.id==='tinashe-popstar'&&<p className={styles.credit}>Fotografía de Tinashe: <a href="https://commons.wikimedia.org/wiki/File:Tinashe_in_November_2024.png" target="_blank" rel="noopener noreferrer">MunRis</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. Recorte de la fotografía disponible bajo la misma licencia.</p>}
    </div>
  </section>;
}
