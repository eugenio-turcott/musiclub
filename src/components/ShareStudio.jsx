'use client';
import {useEffect,useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {UiIcon} from './UiIcon';
import {useDialogFocus} from '../hooks/useDialogFocus';
import {renderSocialCard,SHARE_FORMATS,SHARE_THEMES} from '../utils/socialCards';
import {getReleaseUrl} from '../utils/ratingUtils';
import './ShareStudio.css';
import {DEFAULT_TIERS,tierPageSize} from '../utils/tierList.mjs';

export function ShareStudio({isOpen,onClose,kind='review',review={},album:rawAlbum={},profile:rawProfile={},tierGroups={},profileLoading=false,profileError='',onRetryProfile}){
  const ref=useDialogFocus(isOpen,onClose);
  const [format,setFormat]=useState('story'),[theme,setTheme]=useState('neon'),[quote,setQuote]=useState(false);
  const [selectedTier,setSelectedTier]=useState(null),[page,setPage]=useState(0);
  const tier=selectedTier||DEFAULT_TIERS.find(t=>tierGroups[t.id]?.length)?.id||'S';
  const pageSize=tierPageSize(format),pageCount=Math.max(1,Math.ceil((tierGroups[tier]?.length||0)/pageSize)),safePage=Math.min(page,pageCount-1);
  const [preview,setPreview]=useState(null),[busy,setBusy]=useState(false),[notice,setNotice]=useState(''),[error,setError]=useState('');
  const album={...rawAlbum,album_name:rawAlbum?.album_name||rawAlbum?.album,artist_name:rawAlbum?.artist_name||rawAlbum?.artista};
  // Exports contain public musical identity only: never account emails or private inbox data.
  const profile={id:rawProfile.id,name:rawProfile.name,avatar_url:rawProfile.avatar_url||rawProfile.avatar,bio:rawProfile.bio,favorite_artist:rawProfile.favorite_artist,favorite_album:rawProfile.favorite_album,favorite_genres:rawProfile.favorite_genres,total_xp:rawProfile.total_xp,review_count:rawProfile.review_count,total_tracks_rated:rawProfile.total_tracks_rated,badges:rawProfile.badges?.map(({id,label,name,title,tierNumber,tier,tierRoman,color,badgeClass,isRecord,type})=>({id,label,name,title,tierNumber,tier,tierRoman,color,badgeClass,isRecord,type}))};
  const payload=JSON.stringify({kind,review,album,profile,format,theme,includeQuote:quote,tierGroups,tier,page:safePage});
  useEffect(()=>{
    if(!isOpen||profileLoading||profileError)return;
    let current=true;setBusy(true);setError('');
    renderSocialCard(JSON.parse(payload)).then(canvas=>{const url=canvas.toDataURL('image/png');if(current)setPreview({url,canvas,key:payload});}).catch(()=>{if(current)setError('No se pudo crear la imagen. Prueba con otra foto o formato.');}).finally(()=>{if(current)setBusy(false);});
    return()=>{current=false;};
  },[isOpen,payload,profileLoading,profileError]);
  const link=useMemo(()=>`https://www.musiclub.org${kind!=='review'?`/leaderboard${profile.id?`?miembro=${encodeURIComponent(profile.id)}`:''}`:getReleaseUrl(album)}`,[kind,profile.id,album.album_name,album.artist_name,album.id]);
  if(!isOpen)return null;
  const selected=SHARE_FORMATS.find(f=>f.id===format);
  const pending=busy||preview?.key!==payload||profileLoading||Boolean(profileError);
  const filename=`musiclub-${kind==='tierlist'?`tier-${tier}-${safePage+1}`:kind==='profile'?'mi-perfil':'mi-review'}-${format}.png`;
  const download=()=>{if(!preview||pending)return;const a=document.createElement('a');a.href=preview.url;a.download=filename;a.click();setNotice('Imagen descargada. Lista para subir a tu red favorita.');};
  const file=async()=>{const blob=await new Promise(resolve=>preview.canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Imagen no disponible');return {blob,file:new File([blob],filename,{type:'image/png'})};};
  const share=async()=>{if(!preview||pending)return;try{const result=await file();if(navigator.canShare?.({files:[result.file]})){await navigator.share({files:[result.file],title:'Mi música en Musiclub',text:link});setNotice('Imagen compartida.');}else download();}catch(error){if(error.name!=='AbortError')setNotice('Tu navegador no pudo abrir el menú. Descarga la imagen para compartirla.');}};
  const copy=async()=>{try{const {blob}=await file();await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);setNotice('Imagen copiada.');}catch{setNotice('Este navegador no permite copiar imágenes. Puedes descargarla.');}};
  return createPortal(<div className="share-studio-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={ref} role="dialog" aria-modal="true" aria-label={kind==='tierlist'?'Compartir mi tier list':kind==='profile'?'Compartir mi perfil musical':'Compartir mi reseña'} className="share-studio">
    <header className="share-studio-heading"><div><span>HECHO PARA COMPARTIR</span><h2>{kind==='tierlist'?'Tu tier list musical':kind==='profile'?'Tu perfil musical':'Tu reseña musical'}</h2></div><button type="button" className="share-close" aria-label="Cerrar compartir" onClick={onClose}><UiIcon name="close" tone="inherit"/></button></header>
    <div className="share-studio-layout"><div className="share-canvas-stage" aria-label="Vista previa de la imagen"><div style={{aspectRatio:`${selected.width}/${selected.height}`}} className="share-preview-frame">{preview&&<img src={preview.url} alt={kind==='tierlist'?'Tarjeta de tu tier list':kind==='profile'?'Tarjeta de tu identidad musical':'Tarjeta de tu reseña'} width={preview.canvas.width} height={preview.canvas.height}/>}<span className="share-preview-dimensions">{selected.width} × {selected.height}</span>{pending&&<span className="share-rendering" role="status">{profileError?'No se pudo preparar el perfil':profileLoading?'Consultando tu progreso…':'Preparando tu imagen…'}</span>}</div></div>
      <div className="share-studio-controls"><fieldset><legend>Elige dónde va a vivir</legend><div className="share-format-grid">{SHARE_FORMATS.map(f=><button key={f.id} type="button" aria-pressed={format===f.id} onClick={()=>setFormat(f.id)}><UiIcon name={f.icon} tone="inherit"/><span>{f.label}<small>{f.detail}</small></span></button>)}</div></fieldset>
      {kind==='tierlist'&&<fieldset><legend>Tier y página</legend><div className="share-tier-options">{DEFAULT_TIERS.filter(t=>tierGroups[t.id]?.length).map(t=><button type="button" key={t.id} aria-pressed={tier===t.id} onClick={()=>{setSelectedTier(t.id);setPage(0);}}>Tier {t.id}</button>)}</div><div className="share-tier-pages"><button type="button" disabled={!safePage} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>{safePage+1} / {pageCount}</span><button type="button" disabled={safePage>=pageCount-1} onClick={()=>setPage(p=>p+1)}>Siguiente</button></div><p className="share-studio-help">Una tarjeta por tier. Las selecciones largas se dividen para mantener portadas y letras legibles.</p></fieldset>}
      <fieldset><legend>Una edición muy tuya</legend><div className="share-theme-list">{SHARE_THEMES.map(t=><button type="button" key={t.id} aria-pressed={theme===t.id} onClick={()=>setTheme(t.id)}><i style={{background:t.bg,borderColor:t.accent}}/>{t.label}</button>)}</div></fieldset>
      {kind==='review'&&review.comment&&<label className="share-quote-toggle"><input type="checkbox" checked={quote} onChange={e=>setQuote(e.target.checked)}/>Mostrar una frase en lugar de los criterios</label>}
      <p className="share-studio-help">La imagen conserva sus proporciones en cualquier celular. Elige horizontal para compartir fuera de Stories.</p>
      {(error||profileError)&&<p role="alert" className="share-notice">{error||profileError}{profileError&&<button type="button" onClick={onRetryProfile} className="account-secondary-action">Reintentar</button>}</p>}
      <div className="share-export-actions"><button type="button" className="share-primary" disabled={pending||!preview} onClick={share}><UiIcon name="share" tone="inherit"/>Compartir imagen</button><button type="button" disabled={pending||!preview} onClick={download}><UiIcon name="download" tone="inherit"/>Descargar PNG</button><button type="button" disabled={pending||!preview} onClick={copy}><UiIcon name="copy" tone="inherit"/>Copiar imagen</button><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(link);setNotice('Enlace copiado.');}catch{setNotice(link);}}}><UiIcon name="link" tone="inherit"/>Copiar enlace</button></div>
      {notice&&<p className="share-notice" role="status">{notice}</p>}
      <p className="share-studio-privacy">Tú eliges dónde publicarla. No publicamos nada automáticamente.</p>
    </div></div>
  </section></div>,document.body);
}
