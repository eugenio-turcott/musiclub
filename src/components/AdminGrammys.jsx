'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import {authenticatedFetch} from '../services/authenticatedFetch';
import {GRAMMY_CATEGORIES,GRAMMY_EVENT} from '../data/grammys2027.mjs';
import {grammyNomineeInput,mergeGrammyCategories,readyGrammyCategories,normalizeGrammyNominee} from '../utils/grammyBallot.mjs';
import {UiIcon} from './UiIcon';
import {GrammyMailAdmin} from './GrammyMailAdmin';
import styles from './AdminGrammys.module.css';

const emptyNominee=categoryId=>({categoryId:categoryId||GRAMMY_CATEGORIES[0].id,title:'',artist:'',imageUrl:'',albumId:'',spotifyUrl:'',appleMusicUrl:'',youtubeUrl:'',deezerUrl:''});
const platformFields=[['spotifyUrl','Spotify'],['appleMusicUrl','Apple Music'],['youtubeUrl','YouTube'],['deezerUrl','Deezer']];
const localDate=value=>{const d=new Date(value);if(!Number.isFinite(d.getTime()))return '';return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};
const statusNames={preparing:'Preparando nominados',open:'Predicciones abiertas',closed:'Predicciones cerradas'};
const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

function NomineeEditor({nominee,categories,published,busy,onSave,onCancel}){
 const [form,setForm]=useState(()=>nominee?grammyNomineeInput(nominee):emptyNominee(categories[0]?.id));
 const [query,setQuery]=useState(''),[releases,setReleases]=useState([]),[searching,setSearching]=useState(false),[searched,setSearched]=useState(false),[error,setError]=useState(''),[imageFailed,setImageFailed]=useState(false),[release,setRelease]=useState(nominee?.albums||null);
 const initial=useRef(JSON.stringify(form)),dirty=JSON.stringify(form)!==initial.current;
 const set=(key,value)=>{setForm(current=>({...current,[key]:value}));if(key==='imageUrl')setImageFailed(false);};
 useEffect(()=>{const handler=e=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);},[dirty]);
 const cancel=()=>{if(!dirty||window.confirm('¿Descartar los cambios sin guardar?'))onCancel();};
 async function search(){
  if(query.trim().length<2)return;
  setSearching(true);setError('');setSearched(false);
  try{const response=await authenticatedFetch('/api/grammys/admin?releaseQuery='+encodeURIComponent(query.trim()));const data=await response.json();if(!response.ok)throw new Error(data.error);setReleases(data.releases||[]);setSearched(true);}catch(e){setError(e.message);}finally{setSearching(false);}
 }
 function copyRelease(){
  if(!release)return;
  setForm(current=>({...current,imageUrl:release.image_url||current.imageUrl,spotifyUrl:release.spotify_link||current.spotifyUrl,appleMusicUrl:release.apple_music_link||current.appleMusicUrl,youtubeUrl:release.youtube_link||current.youtubeUrl,deezerUrl:release.other_link?.includes('deezer.com/')?release.other_link:current.deezerUrl}));setImageFailed(false);
 }
 async function submit(e){e.preventDefault();setError('');try{normalizeGrammyNominee(form);await onSave(form);}catch(e){setError(e.message);}}
 return <section className={styles.editor} aria-labelledby="grammy-editor-title">
  <header className={styles.row}><div><span className={styles.eyebrow}>FICHA DEL NOMINADO</span><h2 id="grammy-editor-title">{nominee?'Editar nominado':'Añadir nominado'}</h2><p>Los cambios se reflejan en la página de los Grammy al guardar.</p></div><button type="button" onClick={cancel} disabled={busy}>Volver a la lista</button></header>
  <form onSubmit={submit} className={styles.form}>
   <fieldset disabled={busy}>
    <div className={styles.preview}>{form.imageUrl&&!imageFailed?<img src={form.imageUrl} alt="Vista previa del nominado" onError={()=>setImageFailed(true)} referrerPolicy="no-referrer"/>:<UiIcon name="gramophone" size={60}/>}<div><strong>{form.title||'Título del nominado'}</strong><p>{form.artist||'Artista / créditos'}</p>{imageFailed&&<p role="status">No se pudo cargar la imagen. Revisa la URL o prueba otra.</p>}</div></div>
    <label>Categoría<select value={form.categoryId} disabled={Boolean(nominee&&published)} onChange={e=>set('categoryId',e.target.value)}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    {nominee&&published&&<small>La categoría permanece fija para conservar las predicciones existentes.</small>}
    <label>Título / nombre<input required maxLength={300} value={form.title} onChange={e=>set('title',e.target.value)}/></label>
    <label>Artista / créditos<textarea rows={3} maxLength={500} value={form.artist} onChange={e=>set('artist',e.target.value)}/></label>
    <label>Imagen (URL HTTPS)<input type="url" value={form.imageUrl} onChange={e=>set('imageUrl',e.target.value)} placeholder="https://…"/></label>
    <div className={styles.columns}>{platformFields.map(([key,label])=><label key={key}>{label} (URL)<input type="url" value={form[key]} onChange={e=>set(key,e.target.value)} placeholder="https://…"/></label>)}</div>
    <section className={styles.releaseSearch} aria-labelledby="grammy-release-title"><h3 id="grammy-release-title">Release de Musiclub</h3><p>Asocia un release existente para abrir su ficha con «Escuchar y calificar» y reconocer las reseñas del usuario. Sin asociación, el enlace abre una búsqueda en el catálogo.</p>
     <label>ID del release<input value={form.albumId} onChange={e=>{set('albumId',e.target.value);setRelease(null);}} placeholder="UUID del catálogo"/></label>
     {form.albumId&&<div className={styles.row}><span>{release?`${release.album_name} · ${release.artist_name}`:'Release asociado por identificador'}</span><button type="button" onClick={()=>{set('albumId','');setRelease(null);}}>Quitar asociación</button></div>}
     <label>Buscar release por título<input type="search" value={query} maxLength={120} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();search();}}}/></label>
     <button type="button" disabled={searching||query.trim().length<2} onClick={search}>{searching?'Buscando…':'Buscar en el catálogo'}</button>
     {searched&&!releases.length&&<p role="status">No encontramos releases con ese título.</p>}
     <ul className={styles.releaseResults}>{releases.map(r=><li key={r.id}><span><strong>{r.album_name}</strong><small>{r.artist_name}</small></span><button type="button" onClick={()=>{set('albumId',r.id);setRelease(r);setReleases([]);setSearched(false);}}>Asociar release</button></li>)}</ul>
     {release?.image_url&&<button type="button" onClick={copyRelease}>Copiar portada y enlaces del release</button>}
    </section>
   </fieldset>
   {error&&<p className={styles.error} role="alert">{error}</p>}
   <div className={styles.actions}><button className={styles.primary} disabled={busy||!form.title.trim()} type="submit">{busy?'Guardando…':'Guardar nominado'}</button><button type="button" disabled={busy} onClick={cancel}>Cancelar edición</button></div>
  </form>
 </section>;
}

export default function AdminGrammys(){
 const [data,setData]=useState(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[query,setQuery]=useState(''),[categoryId,setCategoryId]=useState(''),[page,setPage]=useState(1),[editor,setEditor]=useState(null),[deleting,setDeleting]=useState(null),[json,setJson]=useState(''),[winners,setWinners]=useState('');
 const [eventForm,setEventForm]=useState({source:'',nominationsAt:'',closesAt:''}),[categoryForm,setCategoryForm]=useState({id:GRAMMY_CATEGORIES[0].id,name:''});
 const live=useRef(true);
 const load=useCallback(async()=>{
  const response=await authenticatedFetch('/api/grammys/admin'),result=await response.json();if(!response.ok)throw new Error(result.error||'No pudimos cargar los Grammy');
  if(!live.current)return;
  setData(result);setEventForm({source:result.event.source_url||'',nominationsAt:localDate(result.event.nominations_at||GRAMMY_EVENT.nominationsAt),closesAt:localDate(result.event.closes_at||GRAMMY_EVENT.closesAt)});
  setCategoryForm(current=>({id:current.id,name:result.categories.find(c=>c.id===current.id)?.name||GRAMMY_CATEGORIES.find(c=>c.id===current.id)?.name||''}));
 },[]);
 useEffect(()=>{live.current=true;load().catch(e=>{if(live.current)setError(e.message);}).finally(()=>{if(live.current)setLoading(false);});return()=>{live.current=false;};},[load]);
 const categories=useMemo(()=>mergeGrammyCategories(data?.categories),[data?.categories]);
 const filtered=useMemo(()=>{const text=normalize(query.trim());return (data?.nominees||[]).filter(n=>(!categoryId||n.category_id===categoryId)&&normalize([n.title,n.artist,categories.find(c=>c.id===n.category_id)?.name].join(' ')).includes(text));},[data?.nominees,categories,query,categoryId]);
 useEffect(()=>{setPage(1);},[query,categoryId]);
 const pages=Math.max(1,Math.ceil(filtered.length/20)),currentPage=Math.min(page,pages),visible=filtered.slice((currentPage-1)*20,currentPage*20);
 async function refresh(){setLoading(true);setError('');try{await load();}catch(e){setError(e.message);}finally{setLoading(false);}}
 async function mutate(body,message){
  setBusy(true);setError('');setNotice('');
  try{
   const response=await authenticatedFetch('/api/grammys/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),result=await response.json();
   if(!response.ok)throw new Error(result.error||'No se pudo guardar');
   setNotice(message);setEditor(null);setDeleting(null);
   try{await load();}catch{setError('Los cambios se guardaron, pero no pudimos actualizar la lista. Pulsa «Actualizar».');}
   return true;
  }catch(e){if(body.action==='save-nominee')throw e;setError(e.message);return false;}finally{setBusy(false);}
 }
 function exportJson(){const url=URL.createObjectURL(new Blob([JSON.stringify(data.nominees.map(grammyNomineeInput),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='musiclub-grammys-2027.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function importJson(){try{await mutate({action:'import',nominees:JSON.parse(json)},'Lote importado en borrador.');}catch{setError('El JSON no es válido. Revisa el formato.');}}
 async function submitWinners(){try{await mutate({action:'results',winners:JSON.parse(winners),source:eventForm.source},'Ganadores verificados y XP acreditada.');}catch{setError('El JSON de ganadores no es válido.');}}
 return <section className={styles.root} aria-labelledby="grammy-admin-title">
  <header className={styles.header}><div><span className={styles.eyebrow}>ADMINISTRACIÓN · 69.ª EDICIÓN</span><h1 id="grammy-admin-title">Grammys 2027</h1><p>Corrige las fichas, imágenes y enlaces que ve el club.</p></div><div className={styles.actions}><Link href="/grammys" target="_blank" rel="noopener noreferrer">Ver página pública <UiIcon name="arrow"/></Link>{!editor&&<button type="button" disabled={loading||busy} onClick={refresh}>Actualizar</button>}</div></header>
  {notice&&<p className={styles.success} role="status">{notice}</p>}{error&&<p className={styles.error} role="alert">{error}</p>}
  {!data?loading?<p role="status">Cargando administración de los Grammy…</p>:<button type="button" onClick={refresh}>Reintentar</button>:<>
   <div className={styles.stats}><span><strong>{data.nominees.length}</strong> nominados</span><span><strong>{readyGrammyCategories(data.nominees)} / 100</strong> categorías completas</span><span><strong>{statusNames[data.event.status]||data.event.status}</strong> estado de la actividad</span></div>
   {editor?<NomineeEditor key={editor.id||'new'} nominee={editor.id?editor:null} categories={categories} published={Boolean(data.event.published_at)} busy={busy} onCancel={()=>setEditor(null)} onSave={nominee=>mutate({action:'save-nominee',nominee},'Nominado guardado. La página pública mostrará los cambios al actualizarla.')}/>:<>
    <div className={styles.toolbar}><label>Buscar nominado<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Título, artista o categoría"/></label><label>Filtrar categoría<select value={categoryId} onChange={e=>setCategoryId(e.target.value)}><option value="">Todas las categorías</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button className={styles.primary} type="button" disabled={busy||loading} onClick={()=>{setError('');setNotice('');setEditor({});}}>Añadir nominado</button><button type="button" onClick={exportJson}>Exportar JSON</button></div>
    <p className={styles.muted}>{filtered.length} nominados encontrados · Página {currentPage} de {pages}</p>
    <ul className={styles.nominees} aria-label="Nominados Grammy">{visible.map(n=><li key={n.id}><div className={styles.cover}>{n.image_url?<img src={n.image_url} alt="" loading="lazy"/>:<UiIcon name="gramophone"/>}</div><div className={styles.nomineeCopy}><small>{categories.find(c=>c.id===n.category_id)?.name}</small><strong>{n.title}</strong><span>{n.artist}</span><small>{n.album_id?'Release asociado':'Sin release asociado'} · {[[n.spotify_url,'Spotify'],[n.apple_music_url,'Apple Music'],[n.youtube_url,'YouTube'],[n.deezer_url,'Deezer']].filter(([url])=>url).map(([,name])=>name).join(' · ')||'Sin enlaces'}</small></div><div className={styles.actions}><button type="button" disabled={busy} aria-label={`Editar ${n.title}`} onClick={()=>{setError('');setNotice('');setEditor(n);}}>Editar</button><button type="button" disabled={busy} aria-label={`Eliminar ${n.title}`} onClick={()=>setDeleting(n)}>Eliminar</button></div>{deleting?.id===n.id&&<div className={styles.deleteConfirm} role="group" aria-label={`Confirmar eliminación de ${n.title}`}><p>¿Eliminar «{n.title}»? Si tiene predicciones o resultados, se conservará.</p><button type="button" className={styles.danger} disabled={busy} onClick={()=>mutate({action:'delete-nominee',nomineeId:n.id},'Nominado eliminado.')}>Confirmar eliminación</button><button type="button" disabled={busy} onClick={()=>setDeleting(null)}>Conservar nominado</button></div>}</li>)}</ul>
    {!filtered.length&&<p>No hay nominados que coincidan con la búsqueda.</p>}
    {pages>1&&<nav className={styles.pagination} aria-label="Páginas de nominados"><button type="button" disabled={currentPage===1||busy} onClick={()=>setPage(currentPage-1)}>Anterior</button><span>{currentPage} / {pages}</span><button type="button" disabled={currentPage===pages||busy} onClick={()=>setPage(currentPage+1)}>Siguiente</button></nav>}
    <details className={styles.section}><summary>Configuración de la actividad</summary><form onSubmit={e=>{e.preventDefault();mutate({action:'save-event',event:{...eventForm,nominationsAt:new Date(eventForm.nominationsAt).toISOString(),closesAt:new Date(eventForm.closesAt).toISOString()}},'Configuración guardada.');}}><fieldset disabled={busy} className={styles.form}><label>Fuente oficial (Grammy.com)<input required type="url" value={eventForm.source} onChange={e=>setEventForm(s=>({...s,source:e.target.value}))}/></label><p className={styles.muted}>Las fechas se muestran en la zona horaria de este dispositivo ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p><div className={styles.columns}><label>Fecha del anuncio<input required type="datetime-local" value={eventForm.nominationsAt} onChange={e=>setEventForm(s=>({...s,nominationsAt:e.target.value}))}/></label><label>Cierre de predicciones<input required type="datetime-local" value={eventForm.closesAt} onChange={e=>setEventForm(s=>({...s,closesAt:e.target.value}))}/></label></div><button className={styles.primary} type="submit">Guardar configuración</button></fieldset></form><div className={styles.actions}>{data.event.status!=='open'&&<button type="button" disabled={busy||readyGrammyCategories(data.nominees)!==100} onClick={()=>mutate({action:'publish',source:eventForm.source},'Predicciones abiertas.')}>Publicar nominados y abrir predicciones</button>}{data.event.status==='open'&&<button type="button" disabled={busy} onClick={()=>{if(window.confirm('¿Cerrar las predicciones del club? Las elecciones guardadas se conservarán.'))mutate({action:'close'},'Predicciones cerradas.');}}>Cerrar predicciones</button>}</div></details>
    <details className={styles.section}><summary>Nombres de las categorías</summary><form className={styles.form} onSubmit={e=>{e.preventDefault();mutate({action:'save-category',category:categoryForm},'Nombre de la categoría guardado.');}}><label>Categoría a modificar<select value={categoryForm.id} onChange={e=>setCategoryForm({id:e.target.value,name:categories.find(c=>c.id===e.target.value).name})}>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Nombre visible de la categoría<input required maxLength={200} value={categoryForm.name} onChange={e=>setCategoryForm(s=>({...s,name:e.target.value}))}/></label><button type="submit" disabled={busy}>Guardar categoría</button></form></details>
    {!data.event.published_at&&<details className={styles.section}><summary>Importar nominados en borrador</summary><p>Importa un archivo con el formato de nominados. La edición individual está disponible arriba.</p><a href="/grammys-import-example.json" download>Descargar formato de importación</a><label>Nominados (JSON)<textarea value={json} onChange={e=>setJson(e.target.value)} rows={6}/></label><button type="button" disabled={busy||!json.trim()} onClick={importJson}>Importar borrador</button></details>}
    <details className={styles.section}><summary>Ganadores y XP</summary><p>Verifica los ganadores después de la ceremonia. Los aciertos se acreditan una sola vez.</p><label>Ganadores oficiales (JSON)<textarea rows={5} value={winners} onChange={e=>setWinners(e.target.value)} placeholder='[{"categoryId":"album-of-the-year","nomineeId":"…"}]'/></label><button type="button" disabled={busy||!winners.trim()||!eventForm.source} onClick={submitWinners}>Publicar ganadores y acreditar XP</button></details>
    <div className={styles.section}><GrammyMailAdmin/></div>
   </>}
  </>}
 </section>;
}
