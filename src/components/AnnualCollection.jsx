'use client';
import Link from 'next/link';
import {useState} from 'react';
import {UiIcon} from './UiIcon';
import {GenreArtwork} from './GenreArtwork';
import {CoverImage} from './CoverImage';
import {annualGenreGroups,annualReleaseDate,annualReleaseDateLabel} from '../utils/annualPresentation.mjs';
import styles from '../views/AnnualPage.module.css';
const pathFor=r=>r.catalogPath||`/catalogo?${new URLSearchParams({q:`${r.title} ${r.artist}`,tab:'releases'})}`;

function ReleaseCard({release,sources,index,genre,groupSize,groupPosition}){
  const [official,setOfficial]=useState(false),[details,setDetails]=useState(false);
  const refs=release.refs.map(id=>sources.find(s=>s.id===id)).filter(Boolean);
  return <article className={styles.releaseCard} data-annual-reveal style={{'--scene-color':['#ed9dbe','#a3dfcf','#d0c1eb','#eed47f'][index%4]}}>
    <span className={styles.releaseBackdrop} aria-hidden="true">{genre}</span>
    <div className={styles.releaseArt}>{official?<CoverImage src={release.cover} alt={`Portada de ${release.title}`} sizes="(max-width: 600px) 88vw, 400px"/>:<div className={styles.sleeve}><GenreArtwork genre={genre} size={340} className={styles.sleeveVinyl}/><div className={styles.sleeveFront}><CoverImage src={release.cover} alt={`Portada de ${release.title}`} sizes="(max-width: 700px) 70vw, 480px"/></div></div>}<span className={styles.genreArt}><GenreArtwork genre={genre} size={100}/></span><button type="button" onClick={()=>setOfficial(v=>!v)} aria-label={`${official?'Ver edición Musiclub':'Ver portada original'} de ${release.title}`} className={styles.artToggle}><UiIcon name={official?'disc':'image'} size={25}/>{official?'Edición Musiclub':'Portada'}</button></div>
    <div className={styles.releaseCopy}>
      <div className={styles.releaseGroupLabel}><UiIcon name="headphones" size={32}/><strong>{genre}</strong><span>{groupPosition+1} / {groupSize}</span></div>
      <div className={styles.releaseMeta}><UiIcon name="calendar" size={26}/><time dateTime={release.releaseDate||undefined}>{annualReleaseDateLabel(release)}</time></div>
      <h3>{release.title}</h3><p className={styles.artist}>{release.artist}</p>
      <div className={styles.evidenceLine}>{refs.some(s=>s.type==='editorial')&&<span><UiIcon name="review" size={27}/>Selección editorial</span>}{refs.some(s=>s.type==='community')&&<span><UiIcon name="users" size={27}/>Comunidad</span>}{release.nomination&&<span><UiIcon name="gramophone" size={29}/>Nominación</span>}</div>
      <div className={styles.releaseActions}><Link href={pathFor(release)}>Escuchar y reseñar <UiIcon name="arrow" size={28}/></Link><button type="button" aria-expanded={details} onClick={()=>setDetails(v=>!v)} aria-label={`Ver referencias de ${release.title}`}><UiIcon name="info" size={28}/></button></div>
      {details&&<div className={styles.references}><p>Referencias de esta selección</p>{refs.map(source=><a key={source.id} href={source.mirror||source.url} target="_blank" rel="noopener noreferrer">{source.name}<UiIcon name="external" size={21}/></a>)}{release.nomination&&<small>{release.nomination}. Es una nominación; no un premio ganado.</small>}</div>}
    </div>
  </article>;
}
export function AnnualCollection({selection,sources}){
  const groups=annualGenreGroups(selection);let position=0;
  return <section id="seleccion" data-annual-scene className={styles.collection} aria-label="Releases de 2026 por género y fecha">{groups.map(group=><div key={group.key} role="group" aria-label={`${group.genre} · releases de 2026`} data-annual-genre={group.key} className={styles.releaseGrid}>{group.releases.map((release,i)=><div key={release.id} id={`release-${release.id}`} data-annual-scene data-chapter="seleccion" data-release-date={annualReleaseDate(release)}><ReleaseCard release={release} sources={sources} index={position++} genre={group.genre} groupSize={group.releases.length} groupPosition={i}/></div>)}</div>)}</section>;
}
