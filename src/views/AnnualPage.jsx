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
import {ANNUAL_TEASER} from '../data/annual2026Teaser.mjs';
import {AnnualArtOpening} from '../components/AnnualArtOpening';
import styles from './AnnualPage.module.css';

const AnnualShare=dynamic(()=>import('../components/AnnualShare'),{loading:()=>null});
const previews=createRequestCache({ttl:60000,maxEntries:2});
const number=n=>Number(n||0).toLocaleString('es-MX');
const monthNames=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const publicGenres=['Pop','Rock','Hip-Hop','R&B','Indie','Electrónica'];
const pathFor=release=>release.catalogPath||`/catalogo?${new URLSearchParams({q:`${release.title} ${release.artist}`,tab:'releases'})}`;
function Brand(){return <Link href="/" className={styles.brand} aria-label="Volver a Musiclub"><img src="/musiclub_logo_corchea.png" width="34" height="34" alt=""/><span>MUSICLUB<small>EDICIÓN ANUAL · 2026</small></span></Link>;}
function Sleeve({release,genre='Pop',className=''}){return <div className={`${styles.sleeve} ${className}`}><GenreArtwork genre={release?.genre||genre} size={340} className={styles.sleeveVinyl}/><div className={styles.sleeveFront}>{release?.cover?<CoverImage src={release.cover} alt={`Portada de ${release.title}`} sizes="(max-width: 700px) 70vw, 480px"/>:<div className={styles.blankSleeve}><img src="/musiclub_logo_corchea.png" alt="" width="90" height="90"/><strong>2026</strong><span>EDICIÓN DEL CLUB</span></div>}</div></div>;}
function Label({icon='disc',children}){return <span className={styles.label}><UiIcon name={icon} size={20} tone="accent"/>{children}</span>;}
function EditionNav({preview,paused,onToggle,chapter,onPreview,publicPreview}){
  const [open,setOpen]=useState(false);
  const chapters=preview?[['inicio','Inicio'],['seleccion','Los releases'],['club','El club'],['mi-2026','Mi 2026'],['fuentes','Referencias']]:[['inicio','Inicio'],['adelanto','El adelanto'],['tu-2026','Tu 2026']];
  return <header className={styles.editionNav}>
    <Brand/>
    <nav className={styles.editionLinks} aria-label={preview?'Capítulos del año':'Adelanto de la edición anual'} data-open={open}>{chapters.map(([id,label],i)=><a href={`#${id}`} key={id} aria-current={chapter===id?'location':undefined} onClick={()=>setOpen(false)}><span>0{i+1}</span>{label}</a>)}</nav>
    <div className={styles.editionTools}><button type="button" aria-label={paused?'Activar movimiento':'Pausar movimiento'} aria-pressed={paused} onClick={onToggle}><UiIcon name={paused?'play':'pause'}/></button>{onPreview&&<button type="button" aria-label={publicPreview?'Mostrar edición de administrador':'Mostrar adelanto público'} onClick={onPreview}><UiIcon name={publicPreview?'shield':'eye'}/></button>}<button type="button" className={styles.menuToggle} aria-label="Abrir capítulos" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><UiIcon name={open?'close':'list'}/></button><Link href="/catalogo" className={styles.editionExit} aria-label="Volver al club"><span>Volver al club</span><UiIcon name="arrow"/></Link></div>
    <div className={styles.editionProgress} aria-hidden="true"/>
  </header>;
}
function Motion({children,paused,onChapter}){
  const ref=useRef(null);
  useEffect(()=>{
    const scroller=ref.current;
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.dataset.revealed='true';entry.target.dataset.visible=String(entry.isIntersecting);}),{root:scroller,threshold:.08});
    ref.current?.querySelectorAll('[data-annual-reveal]').forEach(el=>observer.observe(el));
    const chapters=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)onChapter(entry.target.dataset.chapter||entry.target.id);}),{root:scroller,rootMargin:'-20% 0px -65% 0px',threshold:0});
    scroller?.querySelectorAll('[data-annual-scene]').forEach(el=>chapters.observe(el));
    const progress=()=>{const max=scroller.scrollHeight-scroller.clientHeight;scroller.parentElement.style.setProperty('--scroll-progress',max>0?scroller.scrollTop/max:0);};
    scroller?.addEventListener('scroll',progress,{passive:true});progress();
    const hash=window.location.hash.slice(1);if(hash)scroller?.querySelector(`#${CSS.escape(hash)}`)?.scrollIntoView({behavior:'instant',block:'start'});
    const visibility=()=>{if(ref.current)ref.current.dataset.hidden=String(document.hidden);};visibility();document.addEventListener('visibilitychange',visibility);
    return()=>{observer.disconnect();chapters.disconnect();scroller?.removeEventListener('scroll',progress);document.removeEventListener('visibilitychange',visibility);};
  },[onChapter]);
  return <main ref={ref} className={styles.experience} data-paused={paused} aria-label="Recorrido de Musiclub 2026" tabIndex={0}>{children}</main>;
}
function ComingSoon(){
  const [selected,setSelected]=useState(0),[unpacked,setUnpacked]=useState(false),[genre,setGenre]=useState('Pop');
  const release=ANNUAL_TEASER[selected];
  return <>
  <AnnualArtOpening/>
  <section id="adelanto" data-annual-scene data-annual-reveal className={styles.spoilerScene} aria-label="Un adelanto de los releases de 2026">
    <div className={styles.spoilerCopy}><Label icon="disc">PRÓXIMAMENTE</Label><h2>Tres discos.<br/><em>Sólo el principio.</em></h2><p>Una pequeña parte de la selección que estamos preparando. Abre una funda y echa un vistazo.</p><div className={styles.teaserChoices} role="group" aria-label="Elegir release del adelanto">{ANNUAL_TEASER.map((r,i)=><button type="button" key={r.id} aria-pressed={selected===i} aria-label={`Mostrar ${r.title}`} onClick={()=>{setSelected(i);setUnpacked(false);}}><CoverImage src={r.cover} alt="" sizes="80px"/><span>{r.artist}</span></button>)}</div><span className={styles.teaserNote}><UiIcon name="lock"/>La selección completa llegará con la edición anual.</span></div>
    <div className={styles.spoilerStage} key={release.id} data-open={unpacked}><span className={styles.backdropWord} aria-hidden="true">2026</span><button type="button" className={styles.unpackButton} aria-pressed={unpacked} aria-label={`${unpacked?'Guardar':'Sacar'} vinilo de ${release.title}`} onClick={()=>setUnpacked(v=>!v)}><Sleeve release={release}/><span><UiIcon name={unpacked?'arrowLeft':'arrow'}/>{unpacked?'Guardar el vinilo':'Sacar el vinilo'}</span></button><div className={styles.teaserCaption} aria-live="polite"><span>{release.genre} / 2026</span><h3>{release.title}</h3><p>{release.artist}</p></div></div>
    <a href="#tu-2026" className={styles.scrollCue}>Y también está tu año <UiIcon name="arrowDown"/></a>
  </section>
  <section id="tu-2026" data-annual-scene data-annual-reveal className={styles.soonBottom}><div className={styles.genreOrbit} aria-hidden="true"><GenreArtwork key={genre} genre={genre} size={520} animated/></div><div className={styles.yearTeaseCopy}><Label icon="heart">02 / TU PROPIO 2026</Label><h2>Tus discos.<br/>Tus géneros.<br/><em>Tu año.</em></h2><p>Los favoritos, las reseñas y los descubrimientos que hicieron tu 2026. Todo en una edición para compartir.</p><div className={styles.genrePills} role="group" aria-label="Explorar vinilos de géneros">{publicGenres.map(g=><button type="button" key={g} aria-pressed={genre===g} onClick={()=>setGenre(g)}>{g}</button>)}</div><span className={styles.soonTag}><i/> PRÓXIMAMENTE EN TU PERFIL</span><Link href="/catalogo" className={styles.primary}>Sigue construyendo tu año <UiIcon name="arrow"/></Link></div></section>
  </>;}
function ReleaseCard({release,sources,index}){
  const [official,setOfficial]=useState(false),[details,setDetails]=useState(false);
  const references=release.refs.map(id=>sources.find(s=>s.id===id)).filter(Boolean);
  return <article className={styles.releaseCard} data-annual-reveal style={{'--scene-color':['#ed9dbe','#a3dfcf','#d0c1eb','#eed47f'][index%4]}}>
    <span className={styles.releaseBackdrop} aria-hidden="true">{release.genre}</span>
    <div className={styles.releaseArt}>{official&&release.cover?<CoverImage src={release.cover} alt={`Portada de ${release.title}`} sizes="(max-width: 600px) 88vw, 400px"/>:<Sleeve release={release}/>}<span className={styles.artNumber}>MC / {String(index+1).padStart(2,'0')}</span><span className={styles.genreArt}><GenreArtwork genre={release.genre} size={64}/></span>{release.cover&&<button type="button" onClick={()=>setOfficial(v=>!v)} aria-label={`${official?'Ver edición Musiclub':'Ver portada original'} de ${release.title}`} className={styles.artToggle}><UiIcon name={official?'disc':'image'} size={18}/>{official?'Edición Musiclub':'Portada'}</button>}</div>
    <div className={styles.releaseCopy}><Label icon="disc">MC / {String(index+1).padStart(2,'0')} · SELECCIÓN 2026</Label><div className={styles.releaseMeta}><span>{release.genre}</span><span>{release.month?monthNames[release.month-1]+' · ':''}2026</span></div><h3>{release.title}</h3><p className={styles.artist}>{release.artist}</p>
    <div className={styles.evidenceLine}>{references.some(s=>s.type==='editorial')&&<span><UiIcon name="review"/>Selección editorial</span>}{references.some(s=>s.type==='community')&&<span><UiIcon name="users"/>Comunidad</span>}{release.nomination&&<span><UiIcon name="gramophone"/>Nominación</span>}</div>
    <div className={styles.releaseActions}><Link href={pathFor(release)}>Escuchar y reseñar <UiIcon name="arrow" size={18}/></Link><button type="button" aria-expanded={details} onClick={()=>setDetails(v=>!v)} aria-label={`Ver referencias de ${release.title}`}><UiIcon name="info" size={19}/></button></div>
    {details&&<div className={styles.references}><p>Referencias de esta selección</p>{references.map(source=><a key={source.id} href={source.mirror||source.url} target="_blank" rel="noopener noreferrer">{source.name}<UiIcon name="external" size={15}/></a>)}{release.nomination&&<small>{release.nomination}. Es una nominación; no un premio ganado.</small>}</div>}</div>
  </article>;
}
function ClubSection({club}){return <section id="club" data-annual-scene className={styles.club} data-annual-reveal><div className={styles.sectionHeading}><div><Label icon="users">02 / LA COMUNIDAD</Label><h2>El año del club.</h2></div><p>Lo que pasó por Musiclub, contado con las reseñas de 2026.</p></div>{club?<><div className={styles.clubNumbers}><div><UiIcon name="review"/><strong>{number(club.reviewCount)}</strong><span>reseñas publicadas</span></div><div><UiIcon name="disc"/><strong>{number(club.releaseCount)}</strong><span>releases reseñados</span></div><div><UiIcon name="users"/><strong>{number(club.memberCount)}</strong><span>nombres en las reseñas</span></div></div><div className={styles.clubTopHeading}><h3>Releases de 2026 mejor calificados</h3><small>Mínimo {club.minimumReviews} reseñas en el año. Promedio ponderado.</small></div>{club.topReleases.length?<ol className={styles.clubList}>{club.topReleases.slice(0,8).map((release,i)=><li key={release.id}><b>{String(i+1).padStart(2,'0')}</b><CoverImage src={release.image} alt="" sizes="72px"/><Link href={getReleaseUrl({id:release.id,album_name:release.title,artist_name:release.artist,release_type:release.release_type})}><strong>{release.title}</strong><span>{release.artist}</span></Link><span className={styles.clubScore}><UiIcon name="star"/>{release.score.toFixed(2)}<small>{release.reviewCount} reseñas</small></span></li>)}</ol>:<p>Todavía no hay releases de 2026 con suficientes reseñas para este ranking.</p>}</>:<p role="status">El resumen del club no está disponible. Puedes reintentar desde la barra de vista previa.</p>}</section>;}
function PersonalSection({personal,onShare}){
  const [page,setPage]=useState(0),[theme,setTheme]=useState('night');
  if(!personal)return <section id="mi-2026" data-annual-scene className={styles.personal}><h2>Mi 2026</h2><p>Tu resumen no está disponible. Reintenta la consulta desde la barra de vista previa.</p></section>;
  const slides=['Tus reseñas','Tus releases','Tus géneros','Mes a mes','Tus artistas'];
  const peak=Math.max(1,...personal.months.map(m=>m.count));
  return <section id="mi-2026" data-annual-scene className={styles.personal} data-annual-reveal><div className={styles.sectionHeading}><div><Label icon="heart">03 / MI 2026</Label><h2>Tu año, disco por disco.</h2></div><p>Tus reseñas en Musiclub. Cada disco cuenta, aunque haya salido antes de 2026.</p></div>
    {!personal.reviewCount?<div className={styles.emptyPersonal}><GenreArtwork genre="Indie" size={160} animated/><h3>Tu primer disco empieza este resumen.</h3><p>Cuando publiques una reseña este año, aparecerá aquí.</p><Link href="/catalogo" className={styles.primary}>Encontrar un release <UiIcon name="arrow"/></Link></div>:<div className={styles.personalLayout}>
      <div className={styles.personalControls}><span className={styles.privateLabel}><UiIcon name="lock"/>Sólo tu actividad</span><h3>{personal.name}</h3><p>Esta es tu edición del año. Cambia de capítulo y elige cómo quieres compartirla.</p><nav aria-label="Capítulos de mi año">{slides.map((label,i)=><button type="button" key={label} aria-pressed={page===i} onClick={()=>setPage(i)}><span>0{i+1}</span>{label}<UiIcon name={['review','disc','headphones','calendar','mic'][i]}/></button>)}</nav><fieldset><legend>Elige tu edición</legend>{[['night','Noche del club'],['paper','En papel'],['mint','Menta']].map(([id,label])=><button type="button" key={id} aria-pressed={theme===id} onClick={()=>setTheme(id)} className={styles.themeButton}><i data-theme={id}/>{label}</button>)}</fieldset><button type="button" className={styles.primary} onClick={()=>onShare({personal,theme})}><UiIcon name="share"/>Compartir mi 2026</button><small>Se genera una imagen. Tú decides dónde publicarla.</small></div>
      <div className={styles.personalPoster} data-theme={theme} aria-live="polite"><div className={styles.posterBrand}><img src="/musiclub_logo_corchea.png" alt="Musiclub" width="38" height="38"/><strong>MI 2026</strong><span>{String(page+1).padStart(2,'0')} / 05</span></div><div className={styles.personalSlide} key={page}>
        {page===0&&<><p>UN AÑO DE RESEÑAS</p><h3>{personal.name}</h3><div className={styles.personalBig}><strong>{number(personal.reviewCount)}</strong><span>releases reseñados</span></div><div className={styles.personalMini}><div><UiIcon name="music"/><b>{number(personal.trackCount)}</b><span>tracks calificados</span></div><div><UiIcon name="mic"/><b>{number(personal.artistCount)}</b><span>artistas</span></div><div><UiIcon name="star"/><b>{personal.meanScore?.toFixed(1)||'—'}</b><span>nota media</span></div></div><div className={styles.personalXP}><UiIcon name="sparkles"/><strong>{number(personal.activityXP)} XP</strong><span>por reseñas, comentarios y tracks</span></div></>}
        {page===1&&<><p>TUS MEJORES NOTAS</p><h3>Los discos que destacaste.</h3><div className={styles.personalCovers}>{personal.topReleases.slice(0,6).map((r,i)=><div key={r.id}><CoverImage src={r.image} alt={r.title} sizes="220px"/><span>0{i+1} <b>{r.score.toFixed(1)}</b></span></div>)}</div><p className={styles.posterCaption}>Ordenados por tu promedio ponderado.</p></>}
        {page===2&&<><p>TU MAPA MUSICAL</p><h3>Sonaron en tus reseñas.</h3><div className={styles.personalGenres}>{personal.genres.slice(0,4).map(genre=><div key={genre.name}><GenreArtwork genre={genre.name} size={105} animated/><strong>{genre.name}</strong><span>{genre.count} releases</span></div>)}</div><p className={styles.posterCaption}>{personal.genres.length?'Un release puede tener más de un género.':'Todavía no hay géneros suficientes para mostrar.'}</p></>}
        {page===3&&<><p>MES A MES</p><h3>Así fue tu año.</h3><div className={styles.monthChart} role="img" aria-label={personal.months.map(m=>`${monthNames[m.month-1]}: ${m.count} reseñas`).join(', ')}>{personal.months.map(m=><div key={m.month}><b>{m.count||''}</b><i style={{height:`${Math.max(2,m.count/peak*170)}px`}}/><span>{monthNames[m.month-1]}</span></div>)}</div><div className={styles.personalMini}><div><UiIcon name="calendar"/><b>{personal.activeDays}</b><span>días con reseñas</span></div><div><UiIcon name="flame"/><b>{personal.longestStreak}</b><span>días de mejor racha</span></div></div><p className={styles.posterCaption}>Días y meses según la hora de Ciudad de México.</p></>}
        {page===4&&<><p>ARTISTAS Y CANCIONES</p><h3>Los nombres de tu año.</h3><ol className={styles.artistList}>{personal.artists.map((artist,i)=><li key={artist.name}><b>0{i+1}</b><strong>{artist.name}</strong><span>{artist.count} {artist.count===1?'release':'releases'}</span></li>)}</ol>{personal.favorites.length>0&&<div className={styles.favoriteSongs}><h4><UiIcon name="heart"/>Entre tus favoritas</h4>{personal.favorites.slice(0,3).map((song,i)=><p key={i}><strong>{song.title}</strong><span>{song.artist}</span></p>)}</div>}<p className={styles.posterCaption}>Según tus reseñas y canciones favoritas.</p></>}
      </div><div className={styles.personalPosterFoot}><span>{personal.name}</span><strong>musiclub.org</strong></div><div className={styles.slideButtons}><button type="button" aria-label="Capítulo anterior de mi año" disabled={page===0} onClick={()=>setPage(v=>v-1)}><UiIcon name="arrowLeft"/></button><button type="button" aria-label="Siguiente capítulo de mi año" disabled={page===slides.length-1} onClick={()=>setPage(v=>v+1)}><UiIcon name="arrow"/></button></div></div>
    </div>}
  </section>;
}
export function AnnualPage(){
  const [chapter,setChapter]=useState('inicio');
  const auth=useAuth(),[data,setData]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0),[publicPreview,setPublicPreview]=useState(false),[paused,setPaused]=useState(false),[filter,setFilter]=useState('all'),[sort,setSort]=useState('editorial'),[share,setShare]=useState(null);
  useEffect(()=>{
    setData(null);setError('');setShare(null);if(!auth.isAdmin||!auth.user?.id)return;
    let active=true;const key=auth.user.id;setLoading(true);
    previews.read(key,async()=>{const response=await authenticatedFetch('/api/annual/2026');const result=await response.json();if(!response.ok)throw new Error(result.error||'No pudimos abrir la vista previa');return result;}).then(result=>{if(active&&result.viewerId===key)setData(result);}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};
  },[auth.isAdmin,auth.user?.id,retry]);
  const allowed=auth.isAdmin&&data?.viewerId===auth.user?.id;
  const visible=allowed&&!publicPreview;
  const selection=visible?data.selection.filter(r=>filter==='all'||(filter==='nomination'?r.nomination:r.refs.some(id=>data.sources.find(s=>s.id===id)?.type===(filter==='community'?'community':'editorial')))):[];
  if(sort==='az')selection.sort((a,b)=>a.artist.localeCompare(b.artist));
  const retryLoad=()=>{previews.invalidate(auth.user.id);setRetry(v=>v+1);};
  return <div className={styles.root} data-private={visible} data-admin={auth.isAdmin} data-opening={chapter==='inicio'}>
    <EditionNav preview={visible} paused={paused} onToggle={()=>setPaused(v=>!v)} chapter={chapter} publicPreview={publicPreview} onPreview={auth.isAdmin?()=>setPublicPreview(v=>!v):undefined}/>
    {auth.isAdmin&&<aside className={styles.adminBar} aria-label="Controles de vista previa anual"><span><UiIcon name="shield"/>VISTA PREVIA · SÓLO ADMINISTRADORES</span><div><button type="button" onClick={()=>setPublicPreview(v=>!v)}>{publicPreview?'Volver a la vista previa':'Ver Próximamente'}<UiIcon name="eye"/></button><button type="button" onClick={retryLoad} disabled={loading}><UiIcon name="repeat"/>Actualizar datos</button></div></aside>}
    {auth.isAdmin&&loading&&<p role="status" className={styles.loadNotice}>Preparando tu vista previa del año…</p>}
    {error&&auth.isAdmin&&<p role="alert" className={styles.loadNotice}>{error}<button type="button" onClick={retryLoad}>Reintentar</button></p>}
    <Motion paused={paused} onChapter={setChapter} key={visible?'preview':'public'}>{!visible?<ComingSoon/>:<>
      <AnnualArtOpening next="seleccion"/>
      <section id="seleccion" data-annual-scene className={styles.collection}><div className={styles.sectionHeading}><div><Label icon="headphones">01 / LOS RELEASES</Label><h2>Para volver a escuchar.</h2></div><p>Selección editorial provisional. Incluye releases que todavía no están en Musiclub.<small>Referencias revisadas el 18 de noviembre de 2026.</small></p></div><div className={styles.filters}><div role="group" aria-label="Filtrar releases del año">{[['all','Todos'],['editorial','Selecciones editoriales'],['community','Conversación'],['nomination','Nominaciones']].map(([id,label])=><button type="button" key={id} aria-pressed={filter===id} onClick={()=>setFilter(id)}>{label}</button>)}</div><label>Ordenar<select value={sort} onChange={e=>setSort(e.target.value)}><option value="editorial">Selección de Musiclub</option><option value="az">Artista · A–Z</option></select></label></div><p className={styles.collectionNote}><UiIcon name="info"/>El orden de esta colección no representa un ranking oficial ni calificaciones de Musiclub.</p><div className={styles.releaseGrid}>{selection.map((release,i)=><div key={release.id} id={`release-${release.id}`} data-annual-scene data-chapter="seleccion"><ReleaseCard release={release} index={i} sources={data.sources}/></div>)}</div></section>
      <ClubSection club={data.club}/><PersonalSection personal={data.personal} onShare={setShare}/>
      <section id="fuentes" data-annual-scene className={styles.sources}><div className={styles.sectionHeading}><div><Label icon="book">04 / REFERENCIAS</Label><h2>De dónde sale la selección.</h2></div><p>Crítica, conversación y nominaciones tienen contextos distintos. Conservamos esa diferencia.</p></div><div className={styles.sourceGrid}>{data.sources.map(source=><article key={source.id}><UiIcon name={source.type==='nomination'?'gramophone':source.type==='community'?'users':'review'} size={28}/><h3>{source.name}</h3><p>{source.note}</p><a href={source.mirror||source.url} target="_blank" rel="noopener noreferrer">Consultar referencia <UiIcon name="external" size={16}/></a></article>)}</div><p className={styles.methodNote}>Corte editorial: {data.researchDate}. Las listas de mitad de año siguen identificadas como tales. Las nominaciones no son premios ganados. Los agregados y las listas que los componen no se suman como votos independientes. La selección se revisará antes de su publicación final.</p></section>
      <section className={styles.ending}><img src="/musiclub_logo_corchea.png" alt="" width="58" height="58"/><h2>Nos queda mucho<br/>por escuchar.</h2><Link href="/catalogo" className={styles.primary}>Volver al catálogo <UiIcon name="arrow"/></Link></section>
    </>}<Footer showAd={false}/></Motion>
    {visible&&share&&<AnnualShare personal={share.personal} initialTheme={share.theme} onClose={()=>setShare(null)}/>}
  </div>;
}
