'use client';
import {createContext, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {UiIcon} from './UiIcon';
import {CoverImage} from './CoverImage';
import {MusiclubVinyl} from './MusiclubVinyl';
import MoodIcon from './MoodIcon';
import {AchievementBadge} from './AchievementBadge';
import {SpotifyLogo, AppleMusicLogo, YouTubeMusicLogo, DeezerLogo} from './common/PlatformLogos';
import {getReleaseUrl, getWeightedReviewScore, getEmotionFromReview, getTrackDisplayName, EMOTIONS} from '../utils/ratingUtils';
import {PROGRESSION_BADGES} from '../utils/badgeSystem';
import {REVIEW_CRITERIA} from '../utils/reviewCriteria.mjs';
import {landingSelection, displayRelease} from '../utils/landingExperience.mjs';
import visuals from '../utils/genreVisuals.cjs';
import styles from './LandingExperience.module.css';

const Motion = createContext({paused:false, toggle:()=>{}});
export const useLandingMotion=()=>useContext(Motion);
const GENRES = ['Pop','Rock','Hip-Hop','Electrónica','Jazz','Indie'];
const icon = (name, size=22) => <UiIcon name={name} size={size} tone="inherit"/>;
const titleOf = album => displayRelease(album).title;

export function LandingMotion({children}) {
  const ref = useRef(null), [paused,setPaused] = useState(false), [reduced,setReduced]=useState(false), [pageVisible,setPageVisible]=useState(true);
  useEffect(()=>{
    const root=ref.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        entry.target.dataset.inView=String(entry.isIntersecting);
        if(entry.isIntersecting) entry.target.dataset.revealed='true';
      }
    },{rootMargin:'40px 0px',threshold:0.04});
    root.querySelectorAll('[data-landing-scene], [data-reveal], .landing-live > section').forEach(el=>observer.observe(el));
    root.dataset.motionReady='true';
    const visibility=()=>{root.dataset.pageVisible=String(!document.hidden);setPageVisible(!document.hidden);};
    visibility();document.addEventListener('visibilitychange',visibility);
    const preference=matchMedia('(prefers-reduced-motion: reduce)'), change=()=>setReduced(preference.matches);
    change();preference.addEventListener('change',change);
    const header=root.querySelector('header'), measure=()=>root.style.setProperty('--landing-header',`${Math.ceil(header?.getBoundingClientRect().height||80)}px`);
    const resize=typeof ResizeObserver==='function'?new ResizeObserver(measure):null;
    if(header)resize?.observe(header);measure();
    return()=>{observer.disconnect();resize?.disconnect();document.removeEventListener('visibilitychange',visibility);preference.removeEventListener('change',change);};
  },[]);
  return <Motion.Provider value={{paused,inactive:paused||reduced||!pageVisible,toggle:()=>setPaused(p=>!p)}}><div ref={ref} className={styles.root} data-landing-experience="" data-motion-paused={paused}>{children}</div></Motion.Provider>;
}

function Vinyl({genre='Pop',className=''}){
 const art=visuals.genreRevealArtwork(genre);
 return <span className={`${styles.vinyl} ${className}`} aria-hidden="true"><img className={styles.pressing} src={art.disc} alt="" width="420" height="420" loading="lazy"/><img className={styles.center} src={art.center} alt="" width="150" height="150" loading="lazy"/></span>;
}

function PlatformStrip(){return <div className={styles.platforms} aria-label="Escucha en tus plataformas"><span><SpotifyLogo/>Spotify</span><span><AppleMusicLogo/>Apple Music</span><span><YouTubeMusicLogo/>YouTube Music</span><span><DeezerLogo/>Deezer</span></div>;}

function Stat({value,label,figure,decimal=false}){
 const ref=useRef(null), [shown,setShown]=useState(value), motion=useContext(Motion);
 useEffect(()=>{
   if(value==null || motion.paused || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)){setShown(value);return;}
   let frame=0;
   const observer=new IntersectionObserver(([entry])=>{
     if(!entry.isIntersecting)return;observer.disconnect();const start=performance.now();
     const step=now=>{const progress=Math.min(1,(now-start)/850);setShown(Number(value)*(1-(1-progress)**3));if(progress<1&&!document.hidden)frame=requestAnimationFrame(step);else setShown(value);};
     frame=requestAnimationFrame(step);
   },{threshold:.3});observer.observe(ref.current);
   return()=>{cancelAnimationFrame(frame);observer.disconnect();};
 },[value,motion.paused]);
 const format=n=>n==null?'—':Number(n).toLocaleString('es-MX',{minimumFractionDigits:decimal?1:0,maximumFractionDigits:decimal?1:0});
 return <div ref={ref} className={styles.stat}><span className={styles.statIcon}>{icon(figure,23)}</span><strong aria-label={format(value)}><span aria-hidden="true" translate="no" className="notranslate" data-stat="number">{format(shown)}</span></strong><span>{label}</span></div>;
}

export function LandingHero({albums,reviews,stats,user,onLogin}){
 const selection=useMemo(()=>landingSelection(albums,reviews),[albums,reviews]);
 const [index,setIndex]=useState(0), [genre,setGenre]=useState(null), motion=useContext(Motion);
 const selected=selection[index%Math.max(1,selection.length)], album=selected?.album, review=selected?.review, release=displayRelease(album);
 const score=review?getWeightedReviewScore(review):album?.final_rating;
 const actualGenre=genre||release.genres[0]||'Pop';
 return <>
 <section className={styles.hero} data-landing-scene="" aria-labelledby="landing-title">
   <div className={styles.heroCopy}>
     <p className={styles.eyebrow}>{icon('headphones',19)} ÁLBUMES, EPS Y CANCIONES. EN COMUNIDAD.</p>
     <h1 id="landing-title">Descubre música.<br/>Compártela en <span>Musiclub.</span></h1>
     <p className={styles.heroText}>Encuentra tu próximo disco, deja tu reseña y descubre qué escucha el club.</p>
     <form action="/catalogo#explorador-catalogo" className={styles.search} role="search"><label htmlFor="home-search" className="sr-only">Buscar álbum o artista</label>{icon('search')}<input id="home-search" name="q" required placeholder="Busca un álbum o artista"/><button type="submit">Buscar {icon('arrow',18)}</button></form>
     <div className={styles.actions}><Link to="/catalogo" className={styles.primary}>Explorar Catálogo {icon('arrow')}</Link>{!user?<button type="button" onClick={onLogin} className={styles.secondary}>Únete al Club {icon('users')}</button>:<Link to="/profile" className={styles.secondary}>Mi Perfil {icon('user')}</Link>}</div>
     <div className={styles.heroLinks}><Link to="/pool">{icon('pool',17)}Explorar pools</Link><Link to="/gashapon">{icon('gashapon',17)}Gashapon Arcade</Link><a href="#musiclub-en-accion">Ver cómo funciona {icon('arrowDown',17)}</a></div>
   </div>
   <div className={styles.studio} aria-label="Tornamesa interactiva de Musiclub">
     <div className={styles.studioOrbit} aria-hidden="true"/>
     <div className={styles.orbitDot} aria-hidden="true"/>
     <div className={styles.floatingScore}>{icon('star',25)}<div><strong>{score!=null?Number(score).toFixed(1):'Tu nota'}<small>{score!=null?'/10':''}</small></strong><span>{review?'RESEÑA DEL CLUB':'ESCÚCHALO. CALIFÍCALO.'}</span></div></div>
     <div className={styles.turntable}>
       <div className={styles.deckTop}><span>{icon('music',18)} MUSICLUB</span><span>ESTÉREO · 33⅓</span></div>
       <div className={styles.platter}><Vinyl genre={actualGenre}/><span className={styles.spindle}/></div>
       <div className={styles.tonearm} aria-hidden="true"><i/><b/><em/></div>
       <div className={styles.deckBottom}><span className={styles.powerLight}/><span className={styles.equalizer} aria-hidden="true">{Array.from({length:13},(_,i)=><i key={i} style={{'--i':i}}/>)}</span><span>VOL <i/><i/><i/></span></div>
     </div>
     {album&&<Link to={getReleaseUrl(album)} className={styles.heroSleeve} aria-label={`Ver release: ${release.title}`}><CoverImage src={release.image} alt={release.title} loading="eager" sizes="240px"/><span><strong>{release.title}</strong><small>{release.artist}</small></span><span className={styles.sleeveArrow}>{icon('arrow',19)}</span></Link>}
     <div className={styles.moodBubble}><MoodIcon mood={review?getEmotionFromReview(review).id:'inspirado'} size={42}/><span>Un disco.<br/><strong>Muchas formas de sentirlo.</strong></span></div>
     {selection.length>1&&<div className={styles.recordPicker} aria-label="Releases de la tornamesa">{selection.slice(0,3).map(({album:a},i)=><button key={a.id} type="button" aria-label={`Mostrar ${titleOf(a)} en la tornamesa`} aria-pressed={index===i} onClick={()=>setIndex(i)}><CoverImage src={displayRelease(a).image} alt="" sizes="54px"/></button>)}</div>}
   </div>
   <div className={styles.motionControl}><span>{icon('disc',16)} Hecho para quienes escuchan más allá del sencillo.</span><button type="button" aria-pressed={motion.paused} onClick={motion.toggle}>{icon(motion.paused?'play':'pause',16)}{motion.paused?'Activar animaciones':'Pausar animaciones'}</button></div>
 </section>
 <section className={styles.stats} aria-label="Musiclub en cifras" data-reveal=""><Stat value={stats.total_reviewed_albums} label="Lanzamientos con Reviews" figure="disc"/><Stat value={stats.total_reviews} label="Reseñas publicadas" figure="review"/><Stat value={stats.total_users} label="Críticos & Miembros" figure="users"/><Stat value={stats.top_score} label="Top Score Comunitario" figure="star" decimal/></section>
 <section className={styles.genreRibbon} data-landing-scene="" aria-label="Vinilos por género"><div><p className={styles.eyebrow}>CADA SONIDO, SU VINILO.</p><h2>¿Qué quieres escuchar?</h2></div><div className={styles.genreButtons}>{GENRES.map(g=><button key={g} type="button" aria-pressed={actualGenre===g} onClick={()=>setGenre(g)} aria-label={`Ver vinilo de ${g}`}><Vinyl genre={g}/><span>{g}</span></button>)}</div><PlatformStrip/></section>
 </>;
}

function ReviewDemo({album,review}){
 const [criterion,setCriterion]=useState(0), [draft,setDraft]=useState(()=>({...review})), [mood,setMood]=useState(()=>review?getEmotionFromReview(review).id:'relajado');
 const [key,label,,max]=REVIEW_CRITERIA[criterion], release=displayRelease(album);
 return <div className={styles.reviewDemo} data-review-demo=""><div className={styles.demoTop}><span>{icon('review',18)} PRUEBA UNA RESEÑA</span><small>Sólo cambia esta vista previa</small></div><div className={styles.demoRelease}><CoverImage src={release.image} alt={release.title}/><div><h3>{release.title}</h3><p>{release.artist}</p><span>{icon('star',18)}{draft.rating_general??'—'}<small>/10 General</small></span></div></div><div className={styles.criteriaTabs} aria-label="Criterios de demostración">{REVIEW_CRITERIA.map(([field,name,glyph,limit,color],i)=><button type="button" key={field} style={{'--criterion':color}} aria-label={`Ajustar ${name}`} aria-pressed={i===criterion} onClick={()=>setCriterion(i)}>{icon(glyph,25)}<span>{draft[field]??'—'}</span></button>)}</div><label className={styles.demoSlider}>{label}<strong>{draft[key]??'—'} / {max}</strong><input aria-label={`${label} de la demostración`} type="range" min="1" max={max} value={draft[key]||1} style={{accentColor:REVIEW_CRITERIA[criterion][4]}} onChange={e=>setDraft(d=>({...d,[key]:Number(e.target.value)}))}/></label><div className={styles.moodPicker} aria-label="Estado de ánimo de demostración">{EMOTIONS.map(e=><button type="button" aria-label={e.label||e.text} key={e.id} aria-pressed={mood===e.id} onClick={()=>setMood(e.id)}><MoodIcon mood={e.id} size={38}/></button>)}</div><p className={styles.demoCaption}>Tu nota. Tus criterios. Tu forma de sentirlo.</p></div>;
}

function CapsuleDemo({selection}){
 const [selected,setSelected]=useState(0), [round,setRound]=useState(0);
 return <div className={styles.capsuleDemo} data-capsule-demo=""><div className={styles.demoTop}><span>{icon('gashapon',20)} MÁQUINA MUSICAL</span><small>Demostración · no cambia ningún Pool</small></div><div className={styles.capsuleStage}>{selection.slice(0,3).map(({album},i)=>{const release=displayRelease(album), art=visuals.genreRevealArtwork(release.genres[0]||'Pop');return <button type="button" className={styles.capsule} key={album.id} style={{'--capsule-color':art.accent,'--i':i}} aria-label={`Inspeccionar cápsula de ${release.title}`} aria-pressed={selected===i} onClick={()=>setSelected(i)}><span className={styles.capsuleBack}><img src={art.disc} alt="" loading="lazy"/><CoverImage src={release.image} alt={release.title}/></span><img className={styles.capsuleLid} src={art.center} alt="" loading="lazy"/><span className={styles.capsuleName}>{release.title}</span></button>;})}</div><div className={styles.machinePanel}><div key={round} className={styles.machineSelection} aria-live="polite"><span className={styles.eyebrow}>EN LA MÁQUINA</span><strong>{titleOf(selection[selected]?.album)}</strong><small>{displayRelease(selection[selected]?.album).artist}</small></div><button type="button" className={styles.lever} aria-label="Probar palanca de demostración" onClick={()=>{setSelected(i=>(i+1)%selection.length);setRound(r=>r+1);}}><span><i/></span><b>TIRA {icon('arrowDown',17)}</b></button></div><div className={styles.poolSteps}><span>{icon('pool',22)}Entra a una sala</span>{icon('arrow',16)}<span>{icon('disc',22)}Propón un release</span>{icon('arrow',16)}<span>{icon('headphones',22)}Escuchen juntos</span></div></div>;
}

function ShareDemo({album,review}){
 const [horizontal,setHorizontal]=useState(false), release=displayRelease(album), favorite=review?.favTrackTitle || (review?.favorite_track?getTrackDisplayName(review.favorite_track,album.tracks||[]):null);
 return <div className={styles.shareDemo}><div className={styles.shareFormats}><button type="button" aria-pressed={!horizontal} onClick={()=>setHorizontal(false)}>{icon('phone',18)}Story</button><button type="button" aria-pressed={horizontal} onClick={()=>setHorizontal(true)}>{icon('image',18)}Horizontal</button></div><div className={`${styles.shareCanvas} ${horizontal?styles.horizontal:''}`} data-share-preview=""><div className={styles.shareBrand}><img src="/musiclub_logo_corchea.png" alt="Musiclub"/><strong>MUSICLUB</strong></div><div className={styles.shareArtwork}><Vinyl genre={release.genres[0]||'Pop'}/><CoverImage src={release.image} alt={release.title}/><strong>{review?Number(getWeightedReviewScore(review)).toFixed(1):Number(album.final_rating||0).toFixed(1)}<small>/10</small></strong></div><div className={styles.shareInfo}><h3>{release.title}</h3><p>{release.artist}</p>{favorite&&<span>{icon('crown',17)}{favorite}</span>}<div className={styles.miniCriteria}>{REVIEW_CRITERIA.map(([key,label,glyph,max,color])=><span key={key} title={label} style={{color}}>{icon(glyph,19)}<b>{review?.[key]??'—'}</b></span>)}</div><footer><span>{review?.reviewer_name||'La comunidad'}</span><b>musiclub.org</b></footer></div></div><p className={styles.demoCaption}>Reseña real del club · Vista previa del diseño</p></div>;
}

const CHAPTERS=[{id:'resenar',num:'01',icon:'sliders',title:'Califica lo que escuchas.',text:'Seis criterios, una nota general y tu canción favorita. Una reseña que cuenta más que un número.',link:'/reviews',action:'Leer reseñas del club',chips:['7 criterios','Canción favorita','Estado de ánimo']},{id:'descubrir',num:'02',icon:'gashapon',title:'Descubre música con el club.',text:'Entra a pools públicos o crea una sala privada. También puedes explorar cápsulas por género en Gashapon.',link:'/pool',action:'Explorar pools',chips:['Pools públicos y privados','Máquina Musical','Gashapon']},{id:'compartir',num:'03',icon:'share',title:'Comparte tu música, a tu estilo.',text:'Convierte tus propias reseñas, tu perfil y tus tier lists en imágenes listas para tus redes.',link:'/profile',action:'Preparar mi tarjeta',chips:['Stories','Horizontal','Tier lists']}];

export function LandingJourney({albums,reviews}){
 const selection=useMemo(()=>landingSelection(albums,reviews),[albums,reviews]);
 const first=selection.find(x=>x.review&&x.review.rating_produccion!=null)||selection[0];
 return <section className={styles.journey} id="musiclub-en-accion" aria-labelledby="journey-title"><header className={styles.sectionHeading} data-reveal=""><p className={styles.eyebrow}>{icon('sparkles',20)} MUSICLUB EN ACCIÓN</p><h2 id="journey-title">Todo lo que puedes hacer<br/><span>en Musiclub.</span></h2><p>Explora las demostraciones. Encuentra tu próxima forma de participar.</p></header><div className={styles.journeyLayout}><nav className={styles.chapterNav} aria-label="Demostraciones de Musiclub">{CHAPTERS.map(c=><a key={c.id} href={`#demo-${c.id}`}><span>{c.num}</span>{icon(c.icon,24)}<strong>{c.id==='resenar'?'Reseñar':c.id==='descubrir'?'Descubrir':'Compartir'}</strong>{icon('arrow',18)}</a>)}<span className={styles.chapterVinyl}><MusiclubVinyl src="/musiclub_logo_4.png" alt=""/></span></nav><div className={styles.chapters}>{CHAPTERS.map((chapter,i)=><article className={styles.chapter} id={`demo-${chapter.id}`} key={chapter.id} data-landing-scene="" data-reveal=""><div className={styles.chapterCopy}><span className={styles.chapterNumber}>{chapter.num} / 03</span><h3>{chapter.title}</h3><p>{chapter.text}</p><div className={styles.chips}>{chapter.chips.map((text,j)=><span key={text}>{icon([chapter.icon,'check','music'][j],15)}{text}</span>)}</div><Link className={styles.textLink} to={chapter.link}>{chapter.action}{icon('arrow',20)}</Link></div>{first?(i===0?<ReviewDemo key={first.album.id} {...first}/>:i===1?<CapsuleDemo selection={selection}/>:<ShareDemo {...first}/>):<div className={styles.emptyDemo}><MusiclubVinyl alt=""/><p>Explora el catálogo para conocer los releases del club.</p></div>}</article>)}</div></div><Link to="/guias" className={styles.guideLink}><span>{icon('book',30)}</span><div><strong>Conoce Musiclub por dentro</strong><p>La guía completa: ejemplos reales, controles que puedes probar y todos los detalles.</p></div>{icon('arrow',27)}</Link><section className={styles.badgeStage} data-landing-scene="" aria-labelledby="landing-badges-title"><div><p className={styles.eyebrow}>{icon('award',20)} INSIGNIAS Y NIVELES</p><h3 id="landing-badges-title">Cada escucha suma.</h3><p>Reseñas, comentarios y pistas calificadas. Tu actividad construye tu recorrido en el club.</p><Link to="/leaderboard" className={styles.textLink}>Ver Leaderboard {icon('arrow')}</Link></div><div className={styles.badgeCollection}>{['tracks','reviews','comments','tens'].map((key,i)=>{const tier=PROGRESSION_BADGES[key].tiers[3];return <div className={styles.badgeCard} key={key} style={{'--i':i}}><span className={styles.badgeOrb}>{icon(['sliders','disc','pen','star'][i],40)}</span><AchievementBadge badge={{...tier,id:`${key}_t${tier.tier}`,tierNumber:tier.tier}}/><span>Desde {tier.req.toLocaleString('es-MX')} {['pistas','reseñas','comentarios','dieces'][i]}</span></div>;})}</div></section></section>;
}

export function LandingFinale({user,onLogin}){
 return <section className={styles.finale} data-landing-scene="" data-reveal=""><div className={styles.finaleDiscs} aria-hidden="true">{['Pop','Hip-Hop','Indie','Rock'].map((g,i)=><Vinyl key={g} genre={g} className={styles.finaleDisc} />)}</div><p className={styles.eyebrow}>TU MÚSICA TIENE UN LUGAR AQUÍ.</p><h2>Escucha. Opina.<br/><span>Hazlo en Musiclub.</span></h2><p>Descubre un release. Comparte lo que te hizo sentir.<br/>Encuentra a quienes también lo están escuchando.</p><div className={styles.actions}>{user?<Link to="/profile" className={styles.primary}>Ir a Mi Perfil de Crítico {icon('user')}</Link>:<button type="button" onClick={onLogin} className={styles.primary}>Iniciar Sesión con Google {icon('arrow')}</button>}<Link to="/guias" className={styles.secondary}>Explorar la guía {icon('book')}</Link></div><PlatformStrip/></section>;
}
