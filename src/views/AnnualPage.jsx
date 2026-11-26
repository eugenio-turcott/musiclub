'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {useEffect,useRef,useState} from 'react';
import {useAuth} from '../hooks/useAuth';
import {authenticatedFetch} from '../services/authenticatedFetch';
import {createRequestCache} from '../services/requestCache.mjs';
import {UiIcon} from '../components/UiIcon';
import {GenreArtwork} from '../components/GenreArtwork';
import {CoverImage} from '../components/CoverImage';
import {Footer} from '../components/Footer';
import {getReleaseUrl} from '../utils/ratingUtils';
import {annualClubMonths} from '../utils/annualPresentation.mjs';
import {AnnualComingSoon} from '../components/AnnualComingSoon';
import {AnnualCollection,AnnualPersonalRanking} from '../components/AnnualCollection';
import {AnnualActivity} from '../components/AnnualActivity';
import {AnnualWorld} from '../components/AnnualWorld';
import {AnnualArtOpening} from '../components/AnnualArtOpening';
import {annualIsPublished} from '../data/annual2026Launch.mjs';
import styles from './AnnualPage.module.css';
import '../styles/annual-icons.css';

const AnnualShare=dynamic(()=>import('../components/AnnualShare'),{loading:()=>null});
const previews=createRequestCache({ttl:60000,maxEntries:2});
const number=n=>Number(n||0).toLocaleString('es-MX');
const monthNames=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function Brand(){return <Link href="/" className={styles.brand} aria-label="Volver a Musiclub"><img src="/musiclub_logo_corchea.png" width="34" height="34" alt=""/><span>MUSICLUB<small>EDICIÓN ANUAL · 2026</small></span></Link>;}

function Label({icon='disc',children}){return <span className={styles.label}><UiIcon name={icon} size={30} tone="accent"/>{children}</span>;}
function EditionNav({preview,paused,onToggle,chapter,onPreview,publicPreview}){
  const [open,setOpen]=useState(false);
  const chapters=preview?[['inicio','Inicio'],['mi-ranking','Tu ranking'],['seleccion','Ranking del club'],['club','El club'],['panorama','El mundo'],['voces','Reseñas'],['mi-2026','Mi 2026']]:[['inicio','Inicio'],['adelanto','El adelanto'],['tu-2026','Tu 2026']];
  return <header className={styles.editionNav} data-annual-icons={!preview||chapter==='inicio'?'dark':'light'}>
    <Brand/>
    <nav data-annual-icons="light" className={styles.editionLinks} aria-label={preview?'Capítulos del año':'Adelanto de la edición anual'} data-open={open}>{chapters.map(([id,label],i)=><a href={`#${id}`} key={id} aria-current={chapter===id?'location':undefined} onClick={()=>setOpen(false)}><span>0{i+1}</span>{label}</a>)}</nav>
    <div className={styles.editionTools}><button type="button" aria-label={paused?'Activar movimiento':'Pausar movimiento'} aria-pressed={paused} onClick={onToggle}><UiIcon name={paused?'play':'pause'}/></button>{onPreview&&<button type="button" aria-label={publicPreview?'Mostrar edición de administrador':'Mostrar adelanto público'} onClick={onPreview}><UiIcon name={publicPreview?'shield':'eye'}/></button>}<button type="button" className={styles.menuToggle} aria-label="Abrir capítulos" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><UiIcon name={open?'close':'list'}/></button><Link href="/catalogo" className={styles.editionExit} aria-label="Volver al club"><span>Volver al club</span><UiIcon name="arrow"/></Link></div>
    <div className={styles.editionProgress} data-annual-progress aria-hidden="true"/>
  </header>;
}
function Motion({children,paused,onChapter}){
  const ref=useRef(null);
  useEffect(()=>{
    const scroller=ref.current;
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.dataset.revealed='true';entry.target.dataset.visible=String(entry.isIntersecting);}),{root:scroller,threshold:.08});
    ref.current?.querySelectorAll('[data-annual-reveal]').forEach(el=>observer.observe(el));
    const scenes=[...scroller.querySelectorAll('[data-annual-scene]')],progressBar=scroller.parentElement.querySelector('[data-annual-progress]');let frame=0,lastChapter='';
    const progress=()=>{
      frame=0;const max=scroller.scrollHeight-scroller.clientHeight,progress=max>0?scroller.scrollTop/max:0;
      const marker=scroller.getBoundingClientRect().top+scroller.clientHeight*.35;
      const scene=scenes.find(el=>{const bounds=el.getBoundingClientRect();return bounds.top<=marker&&bounds.bottom>marker;});
      const current=scene?.dataset.chapter||scene?.id;
      if(progressBar)progressBar.style.transform=`scaleX(${progress})`;
      if(current&&current!==lastChapter){lastChapter=current;onChapter(current);}
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(progress);};
    const resize=new ResizeObserver(schedule);resize.observe(scroller);scroller.addEventListener('scroll',schedule,{passive:true});progress();
    const hash=window.location.hash.slice(1);if(hash)scroller?.querySelector(`#${CSS.escape(hash)}`)?.scrollIntoView({behavior:'instant',block:'start'});
    const visibility=()=>{if(ref.current)ref.current.dataset.hidden=String(document.hidden);};visibility();document.addEventListener('visibilitychange',visibility);
    return()=>{observer.disconnect();resize.disconnect();cancelAnimationFrame(frame);scroller?.removeEventListener('scroll',schedule);document.removeEventListener('visibilitychange',visibility);};
  },[onChapter]);
  return <main ref={ref} className={styles.experience} data-paused={paused} aria-label="Recorrido de Musiclub 2026" tabIndex={0}>{children}</main>;
}

function ClubSection({club}){
  return <section id="club" data-annual-icons="dark" data-annual-scene className={styles.club} data-annual-reveal><div className={styles.sectionHeading}><div><Label icon="users">EL CLUB EN 2026</Label><h2>El año del club.</h2></div><p>Lo que pasó por Musiclub, contado con las reseñas de 2026.</p></div>{club?<><div className={styles.clubNumbers}><div><UiIcon name="review"/><strong>{number(club.reviewCount)}</strong><span>reseñas publicadas</span></div><div><UiIcon name="disc"/><strong>{number(club.releaseCount)}</strong><span>releases reseñados</span></div><div><UiIcon name="users"/><strong>{number(club.memberCount)}</strong><span>nombres en las reseñas</span></div></div><AnnualActivity stats={club}/></>:<p role="status">El resumen del club no está disponible. Puedes reintentar desde la barra de vista previa.</p>}</section>;
}

function AnnualWelcome({name}){
  const greeting=name?.trim()?`${name.trim()}, gracias por compartir este primer año con nosotros.`:'Gracias por compartir este primer año con nosotros.';
  return <section id="bienvenida" data-annual-scene data-chapter="inicio" data-annual-icons="light" className={styles.welcome}>
    <div className={styles.welcomeRecords} aria-hidden="true"><GenreArtwork genre="Pop" size={100} animated rotateLabel/><img src="/musiclub_logo_corchea.png" width="66" height="66" alt=""/><GenreArtwork genre="Rock" size={100} animated rotateLabel/></div>
    <Label icon="heart">ANTES DE COMENZAR</Label><h2>2026 en Musiclub.</h2>
    <p><strong>{greeting}</strong> Musiclub nació el <time dateTime="2026-07-07">7 de julio de 2026</time> y, en pocos meses, hemos construido mucho juntos.</p>
    <p>Sumamos Pools, Gashapon, XP e insignias, predicciones Grammy y nuevas formas de compartir; también mejoramos el catálogo y las reseñas de discos y canciones.</p>
    <p>Cada recomendación y cada opinión le dan vida al club. Este recorrido reúne nuestros favoritos, las voces de la comunidad y tu propio 2026.</p>
    <a href="#mi-ranking">Vamos a los discos <UiIcon name="arrowDown" size={30}/></a>
  </section>;
}

function PersonalSection({personal,onShare}){
  const [page,setPage]=useState(0),[theme,setTheme]=useState('night');
  if(!personal)return <section id="mi-2026" data-annual-scene className={styles.personal}><h2>Mi 2026</h2><p>Tu resumen no está disponible. Reintenta la consulta desde la barra de vista previa.</p></section>;
  const slides=['Tus reseñas','Tus releases','Tus géneros','Mes a mes','Tus artistas'];
  const displayMonths=annualClubMonths(personal.months),peak=Math.max(1,...displayMonths.map(m=>m.count));
  return <section id="mi-2026" data-annual-scene className={styles.personal} data-annual-reveal><div className={styles.sectionHeading}><div><Label icon="heart">MI 2026</Label><h2>Tu año, disco por disco.</h2></div><p>Tus reseñas en Musiclub. Cada disco cuenta, aunque haya salido antes de 2026.</p></div>
    {!personal.reviewCount?<div className={styles.emptyPersonal}><GenreArtwork genre="Indie" size={160} animated/><h3>Tu primer disco empieza este resumen.</h3><p>Cuando publiques una reseña este año, aparecerá aquí.</p><Link href="/catalogo" data-annual-icons="dark" className={styles.primary}>Encontrar un release <UiIcon name="arrow"/></Link></div>:<div className={styles.personalLayout}>
      <div className={styles.personalControls}><span className={styles.privateLabel}><UiIcon name="lock"/>Sólo tu actividad</span><h3>{personal.name}</h3><p>Esta es tu edición del año. Cambia de capítulo y elige cómo quieres compartirla.</p><nav aria-label="Capítulos de mi año">{slides.map((label,i)=><button type="button" key={label} aria-pressed={page===i} data-annual-icons={page===i?'dark':'light'} onClick={()=>setPage(i)}><span>0{i+1}</span>{label}<UiIcon name={['review','disc','headphones','calendar','mic'][i]}/></button>)}</nav><fieldset><legend>Elige tu edición</legend>{[['night','Noche del club'],['paper','En papel'],['mint','Menta']].map(([id,label])=><button type="button" key={id} aria-pressed={theme===id} onClick={()=>setTheme(id)} className={styles.themeButton}><i data-theme={id}/>{label}</button>)}</fieldset><button type="button" data-annual-icons="dark" className={styles.primary} onClick={()=>onShare({personal,theme})}><UiIcon name="share"/>Compartir mi 2026</button><small>Se genera una imagen. Tú decides dónde publicarla.</small></div>
      <div className={styles.personalPoster} data-annual-icons={theme==='night'?'dark':'light'} data-theme={theme} aria-live="polite"><div className={styles.posterOrnaments} aria-hidden="true"><GenreArtwork genre={personal.genres[0]?.name||'Pop'} size={165}/><span>2026</span></div><div className={styles.posterBrand}><img src="/musiclub_logo_corchea.png" alt="Musiclub" width="38" height="38"/><strong>MI 2026</strong><span>{String(page+1).padStart(2,'0')} / 05</span></div><div className={styles.personalSlide} key={page}><div className={styles.slideEmblem} aria-hidden="true"><UiIcon name={['review','disc','headphones','calendar','mic'][page]} size={38}/><span>EDICIÓN PERSONAL</span></div>
        {page===0&&<><p>UN AÑO DE RESEÑAS</p><h3>{personal.name}</h3><div className={styles.personalBig}><div className={styles.personalRecord} aria-hidden="true"><GenreArtwork genre={personal.genres[0]?.name||'Pop'} size={115}/></div><strong>{number(personal.reviewCount)}</strong><span>releases reseñados</span></div><div className={styles.personalMini}><div><UiIcon name="music"/><b>{number(personal.trackCount)}</b><span>tracks calificados</span></div><div><UiIcon name="mic"/><b>{number(personal.artistCount)}</b><span>artistas</span></div><div><UiIcon name="star"/><b>{personal.meanScore?.toFixed(1)||'—'}</b><span>nota media</span></div></div><div data-annual-icons={theme==='paper'?'light':'dark'} className={styles.personalXP}><UiIcon name="sparkles"/><strong>{number(personal.activityXP)} XP</strong><span>por reseñas, comentarios y tracks</span></div></>}
        {page===1&&<><p>TUS MEJORES NOTAS</p><h3>Los discos que destacaste.</h3><div className={styles.personalCovers}>{personal.topReleases.slice(0,6).map((r,i)=><div key={r.id}><GenreArtwork genre={r.genres?.[0]||'Pop'} size={75} className={styles.miniSleeveVinyl}/><CoverImage src={r.image} alt={r.title} sizes="220px"/><span>0{i+1} <b>{r.score.toFixed(1)}</b></span></div>)}</div><p className={styles.posterCaption}>Ordenados por tu promedio ponderado.</p></>}
        {page===2&&<><p>TU MAPA MUSICAL</p><h3>Sonaron en tus reseñas.</h3><div className={styles.personalGenres}>{personal.genres.slice(0,4).map(genre=><div key={genre.name}><GenreArtwork genre={genre.name} size={105} animated/><strong>{genre.name}</strong><span>{genre.count} releases</span></div>)}</div><p className={styles.posterCaption}>{personal.genres.length?'Un release puede tener más de un género.':'Todavía no hay géneros suficientes para mostrar.'}</p></>}
        {page===3&&<><p>MES A MES</p><h3>Así fue tu año.</h3><div className={styles.monthChart} data-personal-months role="img" aria-label={displayMonths.map(m=>`${monthNames[m.month-1]}: ${m.count} reseñas`).join(', ')}>{displayMonths.map(m=><div key={m.month}><b>{m.count||''}</b><i style={{height:`${Math.max(2,m.count/peak*170)}px`}}/><span>{monthNames[m.month-1]}</span></div>)}</div><div className={styles.personalMini}><div><UiIcon name="calendar"/><b>{personal.activeDays}</b><span>días con reseñas</span></div><div><UiIcon name="flame"/><b>{personal.longestStreak}</b><span>días de mejor racha</span></div></div><p className={styles.posterCaption}>Desde julio, cuando comenzó Musiclub. Hora de Ciudad de México.</p></>}
        {page===4&&<><p>ARTISTAS Y CANCIONES</p><h3>Los nombres de tu año.</h3><ol className={styles.artistList}>{personal.artists.map((artist,i)=><li key={artist.name}><b>0{i+1}</b><strong>{artist.name}</strong><span>{artist.count} {artist.count===1?'release':'releases'}</span></li>)}</ol>{personal.favorites.length>0&&<div className={styles.favoriteSongs}><h4><UiIcon name="heart"/>Entre tus favoritas</h4>{personal.favorites.slice(0,3).map((song,i)=><p key={i}><strong>{song.title}</strong><span>{song.artist}</span></p>)}</div>}<p className={styles.posterCaption}>Según tus reseñas y canciones favoritas.</p></>}
      </div><div className={styles.personalPosterFoot}><span><img src="/musiclub_logo_corchea.png" alt="" width="25" height="25"/>{personal.name}</span><strong>musiclub.org</strong></div><div data-annual-icons="dark" className={styles.slideButtons}><button type="button" aria-label="Capítulo anterior de mi año" disabled={page===0} onClick={()=>setPage(v=>v-1)}><UiIcon name="arrowLeft"/></button><button type="button" aria-label="Siguiente capítulo de mi año" disabled={page===slides.length-1} onClick={()=>setPage(v=>v+1)}><UiIcon name="arrow"/></button></div></div>
    </div>}
    {personal.reviewCount>0&&<AnnualActivity stats={personal} personal/>}
  </section>;
}
export function AnnualPage(){
  const [chapter,setChapter]=useState('inicio');
  const [published,setPublished]=useState(false);
  useEffect(()=>{const check=()=>setPublished(annualIsPublished());check();const timer=setInterval(check,30000);document.addEventListener('visibilitychange',check);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',check);};},[]);
  const auth=useAuth(),[data,setData]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0),[publicPreview,setPublicPreview]=useState(false),[paused,setPaused]=useState(false),[share,setShare]=useState(null);
  useEffect(()=>{
    setData(null);setError('');setShare(null);setLoading(false);if((!auth.isAdmin&&!published)||auth.loading)return;
    let active=true;const viewer=auth.user?.id||null,key=viewer||'public';setLoading(true);
    previews.read(key,async()=>{const response=await (viewer?authenticatedFetch('/api/annual/2026'):fetch('/api/annual/2026'));const result=await response.json();if(!response.ok)throw new Error(result.error||'No pudimos abrir la edición');return result;}).then(result=>{if(active&&result.viewerId===viewer)setData(result);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};
  },[auth.isAdmin,auth.user?.id,auth.loading,published,retry]);
  const allowed=(auth.isAdmin||published)&&!!data&&data.viewerId===(auth.user?.id||null);
  const visible=allowed&&!publicPreview;

  const retryLoad=()=>{previews.invalidate(auth.user?.id||'public');setRetry(v=>v+1);};
  return <div className={styles.root} data-annual-icons="light" data-private={visible} data-admin={auth.isAdmin} data-opening={!visible||chapter==='inicio'}>
    <EditionNav preview={visible} paused={paused} onToggle={()=>setPaused(v=>!v)} chapter={chapter} publicPreview={publicPreview} onPreview={auth.isAdmin?()=>setPublicPreview(v=>!v):undefined}/>
    {auth.isAdmin&&<aside className={styles.adminBar} data-annual-icons="dark" aria-label="Controles de vista previa anual"><span><UiIcon name="shield"/>VISTA PREVIA · SÓLO ADMINISTRADORES</span><div><button type="button" onClick={()=>setPublicPreview(v=>!v)}>{publicPreview?'Volver a la vista previa':'Ver Próximamente'}<UiIcon name="eye"/></button><button type="button" onClick={retryLoad} disabled={loading}><UiIcon name="repeat"/>Actualizar datos</button></div></aside>}
    {loading&&<p role="status" className={styles.loadNotice}>Preparando tu edición del año…</p>}
    {error&&(auth.isAdmin||published)&&<p role="alert" className={styles.loadNotice}>{error}<button type="button" onClick={retryLoad}>Reintentar</button></p>}
    <Motion paused={paused} onChapter={setChapter} key={visible?'preview':'public'}>{!visible?<AnnualComingSoon/>:<>
      <AnnualArtOpening next="bienvenida"/><AnnualWelcome name={data.personal?.name}/>
      {auth.user?<AnnualPersonalRanking personal={data.personal}/>:<section id="mi-ranking" className={styles.welcome}><Label icon="user">TU RANKING PERSONAL</Label><h2>Tu ranking empieza contigo.</h2><p>Entra a tu cuenta para ver los álbumes de 2026 que mejor calificaste.</p><button type="button" onClick={auth.loginWithGoogle} className={styles.primary}>Ver mi año <UiIcon name="arrow"/></button></section>}
      <AnnualCollection selection={data.selection}/>
      <ClubSection club={data.club}/><AnnualWorld yearbook={data.yearbook} playlists={data.playlists}/>{auth.user?<PersonalSection personal={data.personal} onShare={setShare}/>:<section id="mi-2026" className={styles.personal}><h2>Tu año, disco por disco.</h2><p>Entra a tu cuenta para descubrir tu edición personal.</p><button type="button" onClick={auth.loginWithGoogle} className={styles.primary}>Entrar a Musiclub <UiIcon name="arrow"/></button></section>}
      <section className={styles.ending}><img src="/musiclub_logo_corchea.png" alt="" width="58" height="58"/><h2>Nos queda mucho<br/>por escuchar.</h2><Link href="/catalogo" data-annual-icons="dark" className={styles.primary}>Volver al catálogo <UiIcon name="arrow"/></Link></section>
    </>}<Footer showAd={false}/></Motion>
    {visible&&share&&<AnnualShare personal={share.personal} initialTheme={share.theme} onClose={()=>setShare(null)}/>}
  </div>;
}
