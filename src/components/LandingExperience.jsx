'use client';
import {createContext, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {UiIcon} from './UiIcon';
import {CoverImage} from './CoverImage';
import {MusiclubVinyl} from './MusiclubVinyl';
import MoodIcon from './MoodIcon';
import {AchievementBadge} from './AchievementBadge';
import {LandingTurntable} from './LandingTurntable';
import {GashaponReveal} from './GashaponReveal';
import {SpotifyLogo, AppleMusicLogo, YouTubeMusicLogo, DeezerLogo} from './common/PlatformLogos';
import {getReleaseUrl, getWeightedReviewScore, getEmotionFromReview, getTrackDisplayName, EMOTIONS} from '../utils/ratingUtils';
import {PROGRESSION_BADGES, PERSONALITY_BADGES, RECORD_BADGES_CONFIG, XP_CONFIG, MELOMANO_LEVELS} from '../utils/badgeSystem';
import {REVIEW_CRITERIA} from '../utils/reviewCriteria.mjs';
import {landingSelection, displayRelease, seededRandom} from '../utils/landingExperience.mjs';
import genreRoutes from '../utils/genreRoutes.cjs';
import visuals from '../utils/genreVisuals.cjs';
import styles from './LandingExperience.module.css';

const Motion = createContext({paused:false, toggle:()=>{}});
export const useLandingMotion=()=>useContext(Motion);
const GENRES = ['Pop','Rock','Hip-Hop','Electrónica','Jazz','Indie'];
const icon = (name, size=22) => <UiIcon name={name} size={Math.round(size * 1.25)} tone="inherit"/>;
const titleOf = album => displayRelease(album).title;

function useRandomSelection(albums, reviews) {
 const [seed,setSeed]=useState(null);
 useEffect(()=>setSeed(Math.floor(Math.random()*4294967296)),[]);
 return useMemo(()=>landingSelection(albums,reviews,{random:seed===null?undefined:seededRandom(seed)}),[albums,reviews,seed]);
}

function ExamplePicker({selection,index,onChange,label}) {
 return <div className={styles.examplePicker} aria-label={label}><div><span>{icon('shuffle',18)}{selection.length} ejemplos del club</span><span>{index+1} / {selection.length}</span></div><div>{selection.map(({album},i)=><button type="button" key={album.id} aria-label={`${label}: ${titleOf(album)}`} aria-pressed={index===i} onClick={()=>onChange(i)}><CoverImage src={displayRelease(album).image} alt="" sizes="58px"/></button>)}</div></div>;
}

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
 const selection=useRandomSelection(albums,reviews), motion=useContext(Motion);
 return <>
 <section className={styles.hero} data-landing-scene="" aria-labelledby="landing-title">
   <div className={styles.heroCopy}>
     <h1 id="landing-title">En <span data-gradient-text="">MUSICLUB</span>, descubre, califica y debate cada release.</h1>
     <p className={styles.heroText}>El club social donde cada lanzamiento cuenta: <strong>álbumes, EPs, sencillos y canciones</strong>. Encuentra un disco que conozcas, deja tu valoración y descubre qué escucha la comunidad.</p>
     <form action="/catalogo#explorador-catalogo" className={styles.search} role="search"><label htmlFor="home-search" className="sr-only">Buscar álbum o artista</label>{icon('search')}<input id="home-search" name="q" required placeholder="Busca un álbum o artista"/><button type="submit">Buscar {icon('arrow',18)}</button></form>
     <div className={styles.actions}><Link to="/catalogo" className={styles.primary}>Explorar Catálogo {icon('arrow')}</Link>{!user?<button type="button" onClick={onLogin} className={styles.secondary}>Únete al Club {icon('users')}</button>:<Link to="/profile" className={styles.secondary}>Mi Perfil {icon('user')}</Link>}</div>
     <div className={styles.heroLinks}><Link to="/pool">{icon('pool',17)}Explorar pools</Link><Link to="/gashapon">{icon('gashapon',17)}Gashapon Arcade</Link><a href="#musiclub-en-accion">Ver cómo funciona {icon('arrowDown',17)}</a></div>
   </div>
   <LandingTurntable selection={selection} paused={motion.inactive}/>
   <div className={styles.motionControl}><span>{icon('disc',16)} Hecho para quienes escuchan más allá del sencillo.</span><button type="button" aria-pressed={motion.paused} onClick={motion.toggle}>{icon(motion.paused?'play':'pause',16)}{motion.paused?'Activar animaciones':'Pausar animaciones'}</button></div>
 </section>
 <section className={styles.stats} aria-label="Musiclub en cifras" data-reveal=""><Stat value={stats.total_reviewed_albums} label="Lanzamientos con Reviews" figure="disc"/><Stat value={stats.total_reviews} label="Reseñas publicadas" figure="review"/><Stat value={stats.total_users} label="Críticos & Miembros" figure="users"/><Stat value={stats.top_score} label="Top Score Comunitario" figure="star" decimal/></section>
 <section className={styles.genreRibbon} data-landing-scene="" aria-label="Vinilos por género"><div><p className={styles.eyebrow}>CADA SONIDO, SU VINILO.</p><h2>¿Qué quieres escuchar?</h2></div><div className={styles.genreButtons}>{GENRES.map(g=><Link key={g} to={genreRoutes.genrePath(g)} aria-label={`Explorar ${g}`}><Vinyl genre={g}/><span>{g}</span>{icon('arrow',16)}</Link>)}</div><PlatformStrip/></section>
 </>;
}

function ReviewDemo({album,review}){
 const [criterion,setCriterion]=useState(0), [draft,setDraft]=useState(()=>({...review})), [mood,setMood]=useState(()=>review?getEmotionFromReview(review).id:'relajado');
 const [key,label,,max]=REVIEW_CRITERIA[criterion], release=displayRelease(album);
 return <div className={styles.reviewDemo} data-review-demo=""><div className={styles.demoTop}><span>{icon('review',18)} PRUEBA UNA RESEÑA</span><small>Sólo cambia esta vista previa</small></div><div className={styles.demoRelease}><CoverImage src={release.image} alt={release.title}/><div><h3>{release.title}</h3><p>{release.artist}</p><span>{icon('star',18)}{draft.rating_general??'—'}<small>/10 General</small></span></div></div><div className={styles.criteriaTabs} aria-label="Criterios de demostración">{REVIEW_CRITERIA.map(([field,name,glyph,limit,color],i)=><button type="button" key={field} style={{'--criterion':color,'--content-icon-ink':color}} aria-label={`Ajustar ${name}`} aria-pressed={i===criterion} onClick={()=>setCriterion(i)}>{icon(glyph,25)}<span>{draft[field]??'—'}</span></button>)}</div><label className={styles.demoSlider}>{label}<strong>{draft[key]??'—'} / {max}</strong><input aria-label={`${label} de la demostración`} type="range" min="1" max={max} value={draft[key]||1} style={{accentColor:REVIEW_CRITERIA[criterion][4]}} onChange={e=>setDraft(d=>({...d,[key]:Number(e.target.value)}))}/></label><div className={styles.moodPicker} aria-label="Estado de ánimo de demostración">{EMOTIONS.map(e=><button type="button" aria-label={e.label||e.text} key={e.id} aria-pressed={mood===e.id} onClick={()=>setMood(e.id)}><MoodIcon mood={e.id} size={38}/></button>)}</div><p className={styles.demoCaption}>Tu nota. Tus criterios. Tu forma de sentirlo.</p></div>;
}

function GashaponDemo({selection}) {
 const [selected,setSelected]=useState(0), [stage,setStage]=useState('READY'), [inView,setInView]=useState(false), motion=useContext(Motion), scene=useRef(null);
 const current=selected%selection.length, album=selection[current]?.album, release=displayRelease(album);
 useEffect(()=>{const observer=new IntersectionObserver(([entry])=>setInView(entry.isIntersecting));if(scene.current)observer.observe(scene.current);return()=>observer.disconnect();},[]);
 useEffect(()=>{
   if(!inView)return;
   if(motion.inactive){setStage('REVEALED');return;}
   const timer=setTimeout(()=>{
     if(stage==='READY')setStage('OPENING');
     else if(stage==='OPENING')setStage('REVEALED');
     else{setSelected(index=>(index+1)%selection.length);setStage('READY');}
   },stage==='READY'?2000:stage==='OPENING'?1200:3000);
   return()=>clearTimeout(timer);
 },[stage,motion.inactive,inView,selection.length]);
 return <div ref={scene} className={styles.miniGashapon} data-gashapon-demo="" data-gashapon-active={inView&&!motion.inactive} aria-label="Animación de Gashapon">
   <GashaponReveal key={album.id} compact genre={release.genres[0]||'Pop'} album={album} stage={stage} duration={1200} onOpen={()=>setStage(motion.inactive?'REVEALED':'OPENING')}/>
   <span className="sr-only">{stage==='REVEALED'?`${release.title}, de ${release.artist}`:'Cápsula de un release del club'}</span>
 </div>;
}

function ShareDemo({album,review}){
 const [horizontal,setHorizontal]=useState(false), release=displayRelease(album), favorite=review?.favTrackTitle || (review?.favorite_track?getTrackDisplayName(review.favorite_track,album.tracks||[]):null);
 return <div className={styles.shareDemo}><div className={styles.shareFormats}><button type="button" aria-pressed={!horizontal} onClick={()=>setHorizontal(false)}>{icon('phone',18)}Story</button><button type="button" aria-pressed={horizontal} onClick={()=>setHorizontal(true)}>{icon('image',18)}Horizontal</button></div><div className={`${styles.shareCanvas} ${horizontal?styles.horizontal:''}`} data-share-preview=""><div className={styles.shareBrand}><img src="/musiclub_logo_corchea.png" alt="Musiclub"/><strong>MUSICLUB</strong></div><div className={styles.shareArtwork}><Vinyl genre={release.genres[0]||'Pop'}/><CoverImage src={release.image} alt={release.title}/><strong>{review?Number(getWeightedReviewScore(review)).toFixed(1):Number(album.final_rating||0).toFixed(1)}<small>/10</small></strong></div><div className={styles.shareInfo}><h3>{release.title}</h3><p>{release.artist}</p>{favorite&&<span>{icon('crown',17)}{favorite}</span>}<div className={styles.miniCriteria}>{REVIEW_CRITERIA.map(([key,label,glyph,max,color])=><span key={key} title={label} style={{color,'--content-icon-ink':color}}>{icon(glyph,19)}<b>{review?.[key]??'—'}</b></span>)}</div><footer><span>{review?.reviewer_name||'La comunidad'}</span><b>musiclub.org</b></footer></div></div><p className={styles.demoCaption}>Reseña real del club · Vista previa del diseño</p></div>;
}

const CHAPTERS=[{id:'resenar',num:'01',icon:'sliders',title:'Califica lo que escuchas.',text:'Seis criterios, una nota general y tu canción favorita. Una reseña que cuenta más que un número.',link:'/reviews',action:'Leer reseñas del club',chips:['7 criterios','Canción favorita','Estado de ánimo']},{id:'descubrir',num:'02',icon:'gashapon',title:'Descubre releases en Gashapon.',text:'Elige un género, abre una cápsula y encuentra un release del catálogo. Prueba aquí con discos reales del club.',link:'/gashapon',action:'Entrar al Gashapon',chips:['Cápsulas por género','Releases del club','Nuevos descubrimientos']},{id:'compartir',num:'03',icon:'share',title:'Comparte tu música, a tu estilo.',text:'Convierte tus propias reseñas, tu perfil y tus tier lists en imágenes listas para tus redes.',link:'/profile',action:'Preparar mi tarjeta',chips:['Stories','Horizontal','Tier lists']}];

function ReviewExamples({selection}) {
 const [index,setIndex]=useState(0), current=index%selection.length, entry=selection[current];
 return <div className={styles.exampleStage}><ReviewDemo key={entry.album.id+'-'+entry.review.id} {...entry}/><ExamplePicker selection={selection} index={current} onChange={setIndex} label="Ejemplo para reseñar"/></div>;
}

function ShareExamples({selection}) {
 const [index,setIndex]=useState(0), current=index%selection.length, entry=selection[current];
 return <div className={styles.exampleStage}><ShareDemo {...entry}/><ExamplePicker selection={selection} index={current} onChange={setIndex} label="Ejemplo para compartir"/></div>;
}

const LANDING_BADGES=[
 ...Object.values(PROGRESSION_BADGES).flatMap(group=>group.tiers.map(tier=>({...tier,id:group.id+'_t'+tier.tier,tierNumber:tier.tier,detail:'Desde '+tier.req.toLocaleString('es-MX')+' '+({tracks:'pistas',reviews:'reseñas',comments:'comentarios',tens:'dieces'}[group.id])}))),
 ...Object.values(PERSONALITY_BADGES).flatMap(group=>group.tiers.map(tier=>({...tier,id:group.id+'_t'+tier.tier,tierNumber:tier.tier,detail:group.minReviews+' reseñas · Promedio '+(tier.maxAvg!=null?'≤ '+tier.maxAvg:'≥ '+tier.minAvg)}))),
 ...RECORD_BADGES_CONFIG.map(badge=>({...badge,isRecord:true,detail:'Lidera esta categoría del club'}))
];

function BadgeShowcase() {
 return <section className={styles.badgeStage} data-landing-scene="" aria-labelledby="landing-badges-title">
   <div className={styles.badgeIntro}><p className={styles.eyebrow}>{icon('award',24)} INSIGNIAS Y NIVELES</p><h3 id="landing-badges-title">Tu actividad se convierte en XP.</h3><p>Reseña, comenta y califica canciones. Tu Score XP reúne la actividad, los tiers que desbloqueas y las coronas que conservas.</p><Link to="/leaderboard" className={styles.textLink}>Ver mi progreso y el leaderboard {icon('arrow')}</Link></div>
   <div className={styles.xpRules} aria-label="Cómo ganar XP en Musiclub">{[['review','Publica una reseña',XP_CONFIG.REVIEW_BASE,'Por cada release que calificas.'],['message','Añade tu comentario',XP_CONFIG.REVIEW_COMMENT_BONUS,'Extra cuando tu reseña incluye texto.'],['music','Califica una canción',XP_CONFIG.TRACK_RATED,'Por cada track evaluado.'],['crown','Conserva un récord #1',XP_CONFIG.RECORD_CROWN_BONUS,'Bono activo mientras lideras esa categoría.']].map(([figure,title,xp,detail])=><div key={figure}>{icon(figure,29)}<strong>+{xp}<small> XP</small></strong><b>{title}</b><span>{detail}</span></div>)}</div>
   <div className={styles.xpPath}><div>{icon('sliders',25)}<span><b>Actividad</b>Tu participación suma puntos.</span></div>{icon('arrow',20)}<div>{icon('award',25)}<span><b>Insignias y tiers</b>Supera metas y gana XP adicional.</span></div>{icon('arrow',20)}<div>{icon('chart',25)}<span><b>{MELOMANO_LEVELS.length} niveles</b>Tu XP total determina tu nivel.</span></div></div>
   <p className={styles.xpExample}>{icon('bulb',22)}<span>Una reseña con comentario y 5 canciones calificadas suma <strong>{XP_CONFIG.REVIEW_BASE+XP_CONFIG.REVIEW_COMMENT_BONUS+5*XP_CONFIG.TRACK_RATED} XP de actividad</strong>. Las insignias añaden sus propias recompensas; cada nuevo tier acumula su bono.</span></p>
   <div className={styles.badgeRails} aria-label="Insignias disponibles en Musiclub">{[0,1,2].map(row=>{
     const badges=LANDING_BADGES.filter((_,i)=>i%3===row);
     return <div className={styles.badgeRail} key={row} style={{'--direction':row===1?'normal':'reverse','--duration':(badges.length*5)+'s'}}><div className={styles.badgeTrack}>{[0,1].map(copy=><div className={styles.badgeGroup} key={copy} aria-hidden={copy===1?'true':undefined}>{badges.map(badge=><div className={styles.movingBadge} key={badge.id}><AchievementBadge badge={badge}/><span>{badge.detail}</span><small>+{badge.xp} XP</small></div>)}</div>)}</div></div>;
   })}</div>
 </section>;
}

export function LandingJourney({albums,reviews}) {
 const forReview=useRandomSelection(albums,reviews), forDiscovery=useRandomSelection(albums,reviews), forSharing=useRandomSelection(albums,reviews);
 return <section className={styles.journey} id="musiclub-en-accion" aria-labelledby="journey-title">
   <header className={styles.sectionHeading} data-reveal=""><p className={styles.eyebrow}>{icon('sparkles',23)} MUSICLUB EN ACCIÓN</p><h2 id="journey-title">Todo lo que puedes hacer<br/><span>en Musiclub.</span></h2><p>Diez ejemplos reales en cada demostración. Una selección nueva cada vez que nos visitas.</p></header>
   <div className={styles.journeyLayout}><nav className={styles.chapterNav} aria-label="Demostraciones de Musiclub">{CHAPTERS.map(c=><a key={c.id} href={'#demo-'+c.id}><span>{c.num}</span>{icon(c.icon,26)}<strong>{c.id==='resenar'?'Reseñar':c.id==='descubrir'?'Descubrir':'Compartir'}</strong>{icon('arrow',20)}</a>)}<span className={styles.chapterVinyl}><MusiclubVinyl src="/musiclub_logo_4.png" alt=""/></span></nav>
   <div className={styles.chapters}>{CHAPTERS.map((chapter,i)=><article className={styles.chapter} id={'demo-'+chapter.id} key={chapter.id} data-landing-scene="" data-reveal=""><div className={styles.chapterCopy}><span className={styles.chapterNumber}>{chapter.num} / 03</span><h3>{chapter.title}</h3><p>{chapter.text}</p><div className={styles.chips}>{chapter.chips.map((text,j)=><span key={text}>{icon([chapter.icon,'check','music'][j],19)}{text}</span>)}</div><Link className={styles.textLink} to={chapter.link}>{chapter.action}{icon('arrow',23)}</Link></div>{forReview.length?(i===0?<ReviewExamples selection={forReview}/>:i===1?<GashaponDemo selection={forDiscovery}/>:<ShareExamples selection={forSharing}/>):<div className={styles.emptyDemo}><MusiclubVinyl alt=""/><p>Explora el catálogo para conocer los releases del club.</p></div>}</article>)}</div></div>
   <Link to="/guias" className={styles.guideLink}><span>{icon('book',34)}</span><div><strong>Conoce Musiclub por dentro</strong><p>La guía completa: ejemplos reales, controles que puedes probar y todos los detalles.</p></div>{icon('arrow',30)}</Link>
   <BadgeShowcase/>
 </section>;
}

export function LandingFinale({user,onLogin}){
 return <section className={styles.finale} data-landing-scene="" data-reveal=""><div className={styles.finaleDiscs} aria-hidden="true">{['Pop','Hip-Hop','Indie','Rock'].map((g,i)=><Vinyl key={g} genre={g} className={styles.finaleDisc} />)}</div><p className={styles.eyebrow}>TU MÚSICA TIENE UN LUGAR AQUÍ.</p><h2>Escucha. Opina.<br/><span>Hazlo en Musiclub.</span></h2><p>Descubre un release. Comparte lo que te hizo sentir.<br/>Encuentra a quienes también lo están escuchando.</p><div className={styles.actions}>{user?<Link to="/profile" className={styles.primary}>Ir a Mi Perfil de Crítico {icon('user')}</Link>:<button type="button" onClick={onLogin} className={styles.primary}>Iniciar Sesión con Google {icon('arrow')}</button>}<Link to="/guias" className={styles.secondary}>Explorar la guía {icon('book')}</Link></div><PlatformStrip/></section>;
}
