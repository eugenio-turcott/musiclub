'use client';
import {UiIcon} from './UiIcon';
import {GenreArtwork} from './GenreArtwork';
import {annualClubMonths} from '../utils/annualPresentation.mjs';
import styles from './AnnualActivity.module.css';
const number=n=>Number(n||0).toLocaleString('es-MX');
const months=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function Metric({icon,value,label}){return <div className={styles.metric}><UiIcon name={icon} size={34}/><strong>{value??'—'}</strong><span>{label}</span></div>;}
export function AnnualActivity({stats,personal=false}){
  if(!stats)return null;
  const displayMonths=annualClubMonths(stats.months),peak=Math.max(1,...displayMonths.map(m=>m.count)),peakMonth=[...displayMonths].sort((a,b)=>b.count-a.count)[0],total=(stats.scoreDistribution||[]).reduce((n,b)=>n+b.count,0);
  return <div className={styles.activity} data-personal={personal} data-annual-icons={personal?'light':'dark'} aria-label={personal?'Más estadísticas de mi 2026':'Más estadísticas del club'}>
    <div className={styles.metrics}>
      <Metric icon="music" value={number(stats.trackCount)} label="tracks calificados"/>
      <Metric icon="chat" value={number(stats.commentCount)} label="reseñas con comentario"/>
      <Metric icon="star" value={stats.meanScore?.toFixed(2)} label="nota media ponderada"/>
      <Metric icon="headphones" value={number(stats.genreCount)} label="géneros explorados"/>
      <Metric icon="calendar" value={number(stats.activeDays)} label="días con reseñas"/>
      <Metric icon="sparkles" value={number(stats.perfectCount)} label="notas ponderadas de 10"/>
    </div>
    <div className={styles.panels}>
      <section className={styles.panel} aria-label={personal?'Mi actividad por mes':'Actividad del club por mes'}><h3><UiIcon name="chart"/>El año, mes a mes.</h3><p>{peakMonth?.count?<><strong>{months[peakMonth.month-1]}</strong> fue el mes con más reseñas: {number(peakMonth.count)}.</>:'Las reseñas de cada mes aparecerán aquí.'}</p><div className={styles.months} data-activity-months role="img" aria-label={displayMonths.map(m=>`${months[m.month-1]}: ${m.count} reseñas`).join(', ')}>{displayMonths.map(m=><div key={m.month}><b>{m.count||''}</b><i style={{'--bar':`${m.count/peak*100}%`}}/><span>{months[m.month-1]}</span></div>)}</div></section>
      <section className={styles.panel} aria-label={personal?'Distribución de mis notas':'Distribución de notas del club'}><h3><UiIcon name="sliders"/>Las notas del año.</h3><p>Promedios ponderados de las reseñas.</p><div className={styles.distribution}>{(stats.scoreDistribution||[]).map(b=><div key={b.label}><strong>{b.label}</strong><span><i style={{width:`${total?b.count/total*100:0}%`}}/></span><b>{number(b.count)}</b></div>)}</div><div className={styles.caption}><UiIcon name="star"/>Mediana <strong>{stats.medianScore?.toFixed(2)||'—'}</strong><span>·</span>Tracks <strong>{stats.trackMean?.toFixed(2)||'—'}/10</strong></div></section>
      {personal?<section className={styles.panel} aria-label="Mi XP de actividad"><h3><UiIcon name="bolt"/>Cómo sumaste XP.</h3><p>Tu actividad en reseñas, sin sumar insignias.</p><div className={styles.xp}>{[['review','Reviews','reviews'],['chat','Comentarios','comments'],['music','Tracks','tracks']].map(([icon,label,key])=><div key={key}><UiIcon name={icon}/><span>{label}</span><strong>{number(stats.xpBreakdown?.[key])} XP</strong></div>)}</div><div className={styles.caption}><UiIcon name="flame"/><strong>{stats.longestStreak}</strong> días de mejor racha</div></section>:<section className={styles.panel} aria-label="Géneros del club"><h3><UiIcon name="disc"/>Los géneros del club.</h3><p>Releases distintos reseñados en 2026.</p><div className={styles.genres}>{(stats.genres||[]).slice(0,4).map(g=><div key={g.name}><GenreArtwork genre={g.name} size={48}/><strong>{g.name}</strong><span>{number(g.count)}</span></div>)}</div><p className={styles.caption}>Un release puede pertenecer a varios géneros.</p></section>}
    </div>
    {personal&&<div className={styles.foot}><span><UiIcon name="review"/><strong>{number(stats.wordCount)}</strong> palabras en tus reseñas</span><span><UiIcon name="mic"/><strong>{number(stats.artistCount)}</strong> artistas</span><span><UiIcon name="heart"/>Primera reseña: <strong>{stats.firstDay||'—'}</strong></span></div>}
  </div>;
}
