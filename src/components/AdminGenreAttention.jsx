'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {authenticatedFetch} from '../services/authenticatedFetch';
import {UiIcon} from './UiIcon';
import {CoverImage} from './CoverImage';
import {GenreArtwork} from './GenreArtwork';
import catalog from '../utils/genreCatalog.cjs';
import identity from '../utils/releaseIdentity.cjs';
import styles from './AdminGenreAttention.module.css';

function PendingRelease({album,onAction,busy}){
 const [editing,setEditing]=useState(false),[query,setQuery]=useState(''),[selected,setSelected]=useState([]);
 const fold=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(),search=fold(query),exact=catalog.genreKey(query);
 const priority=genre=>genre.id===exact?0:fold(genre.name).startsWith(search)?1:2;
 const options=search.length>1?catalog.GENRES.filter(g=>(g.id===exact||fold(g.name).includes(search))&&!selected.includes(g.name)).sort((a,b)=>priority(a)-priority(b)||a.name.localeCompare(b.name,'es')).slice(0,8):[];
 return <article className={styles.card}><header><CoverImage src={album.image_url} alt="" sizes="90px"/><div><h3>{album.album_name}</h3><p>{album.artist_name}</p><Link href={identity.releasePath(album)}>Ver release <UiIcon name="arrow"/></Link></div></header><div className={styles.meta}><span><UiIcon name="clock"/>{album.genre_retry_count||0} comprobaciones automáticas</span><span><UiIcon name="cycle"/>Próximo intento: {new Date(album.genre_retry_at).toLocaleString('es-MX',{dateStyle:'short',timeStyle:'short'})}</span></div><div className={styles.actions}><button disabled={busy} onClick={()=>onAction({action:'retry',albumId:album.id})}><UiIcon name="cycle"/>Volver a buscar</button><button disabled={busy} aria-expanded={editing} onClick={()=>setEditing(!editing)}><UiIcon name="edit"/>Verificar género</button></div>{editing&&<div className={styles.editor}><label>Busca un género verificado<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ej. Rock, Cumbia, Clásica…" aria-label={`Buscar género para ${album.album_name}`}/></label><div className={styles.options}>{options.map(genre=><button key={genre.id} onClick={()=>{setSelected([...selected,genre.name]);setQuery('');}}><GenreArtwork genre={genre.id} size={32}/>{genre.name}<UiIcon name="plus"/></button>)}</div><div className={styles.chips}>{selected.map(name=><button key={name} aria-label={`Quitar ${name}`} onClick={()=>setSelected(selected.filter(g=>g!==name))}>{name}<UiIcon name="close"/></button>)}</div><button disabled={busy||!selected.length} onClick={()=>onAction({action:'assign',albumId:album.id,genres:selected})}><UiIcon name="check"/>Guardar géneros</button></div>}</article>;
}
export default function AdminGenreAttention({active=false}){
 const [data,setData]=useState(null),[offset,setOffset]=useState(0),[error,setError]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const load=useCallback(async()=>{
  try{const response=await authenticatedFetch(`/api/genres/pending?offset=${active?offset:0}`),body=await response.json();if(!response.ok)throw new Error(body.error);setData(body);setError('');}
  catch{setError('No pudimos consultar los géneros pendientes.');}
 },[active,offset]);
 useEffect(()=>{let current=true;const refresh=()=>{if(current)load();};refresh();const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);return()=>{current=false;clearInterval(timer);window.removeEventListener('focus',refresh);};},[load]);
 async function action(body){setBusy(true);setNotice('');setError('');try{const response=await authenticatedFetch('/api/genres/pending',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),result=await response.json();if(!response.ok)throw new Error(result.error);setNotice(body.action==='assign'?'Géneros verificados.':result.resolved?'Género encontrado y actualizado.':'Todavía no hay un género verificable. El release sigue disponible y volveremos a comprobarlo.');await load();}catch(e){setError(e.message);}finally{setBusy(false);}}
 if(!active)return data?.total>0?<Link href="/admin/generos" className={styles.banner}><UiIcon name="bell"/><strong>{data.total} {data.total===1?'release necesita':'releases necesitan'} verificación de género</strong><span>Revisar pendientes <UiIcon name="arrow"/></span></Link>:null;
 return <section className={styles.section} aria-label="Géneros pendientes"><header className={styles.heading}><div><span>AVISOS DEL CATÁLOGO</span><h2>Géneros por verificar <b>{data?.total??'—'}</b></h2><p>Estos releases ya se pueden escuchar y reseñar. Musiclub vuelve a consultar las fuentes automáticamente; también puedes verificar su género aquí.</p></div><button disabled={busy} onClick={load}><UiIcon name="cycle"/>Actualizar</button></header>{error&&<p role="alert" className={styles.error}>{error}</p>}{notice&&<p role="status" className={styles.notice}>{notice}</p>}{!data&&!error&&<p role="status">Consultando pendientes…</p>}{data?.total===0&&<div className={styles.empty}><UiIcon name="check"/><h3>Todo el catálogo tiene género.</h3><p>Los nuevos pendientes aparecerán aquí automáticamente.</p></div>}<div className={styles.grid}>{data?.albums.map(album=><PendingRelease key={album.id} album={album} onAction={action} busy={busy}/>)}</div>{data&&data.total>25&&<nav className={styles.actions} aria-label="Páginas de géneros pendientes"><button disabled={offset===0} onClick={()=>setOffset(Math.max(0,offset-25))}>Anterior</button><span>{offset+1}–{Math.min(offset+25,data.total)} de {data.total}</span><button disabled={offset+25>=data.total} onClick={()=>setOffset(offset+25)}>Siguiente</button></nav>}</section>;
}
