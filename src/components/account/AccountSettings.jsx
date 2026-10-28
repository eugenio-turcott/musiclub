'use client';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AppHeader } from '../AppHeader';
import { Footer } from '../Footer';
import { UiIcon } from '../UiIcon';
import { GenreLabel } from '../GenreLabel';
import { SpotifyIcon, InstagramIcon } from '../ShareReviewModal';
import { AccountAvatar, AccountSection } from './AccountElements';

const AVAILABLE_GENRES=['Rock','Indie','Hip-Hop','Pop','Electrónica','Synthwave','R&B / Soul','Jazz','Metal','Punk','Folk','Reggae','Ambient','Shoegaze','Clásica','Latino / Trap'];
const EMPTY={name:'',avatar:'',bio:'',favoriteArtist:'',favoriteAlbum:'',selectedGenres:[],spotifyUrl:'',instagramUrl:''};
function userFields(user) {
  return {name:user?.name || '',avatar:user?.avatar_url || user?.avatar || '',bio:user?.bio || '',favoriteArtist:user?.favorite_artist || '',favoriteAlbum:user?.favorite_album || '',selectedGenres:Array.isArray(user?.favorite_genres)?user.favorite_genres:[],spotifyUrl:user?.spotify_url || '',instagramUrl:user?.instagram_url || ''};
}
const signature=form=>JSON.stringify({...form,selectedGenres:[...form.selectedGenres].sort()});

export function AccountSettings() {
  const {user,updateProfile,loading:authLoading}=useAuth();
  const [form,setForm]=useState(EMPTY);
  const [baseline,setBaseline]=useState(EMPTY);
  const [initializedKey,setInitializedKey]=useState(null);
  const [customGenre,setCustomGenre]=useState('');
  const [saving,setSaving]=useState(false);
  const [draftSaved,setDraftSaved]=useState(false);
  const [success,setSuccess]=useState('');
  const [error,setError]=useState('');
  const draftKey=user?.id?`musiclub_settings_draft_${user.id}`:user?.email?`musiclub_settings_draft_${user.email}`:null;
  const hasChanges=signature(form)!==signature(baseline);

  useEffect(()=>{
    if(!user || !draftKey){setInitializedKey(null);return;}
    if(initializedKey===draftKey)return;
    const current=userFields(user);
    let restored={};
    try {
      const saved=JSON.parse(localStorage.getItem(draftKey) || 'null');
      if(saved && typeof saved==='object'){
        for(const key of Object.keys(EMPTY)) {
          if(key==='selectedGenres' && Array.isArray(saved[key]))restored[key]=saved[key].filter(value=>typeof value==='string');
          else if(key!=='selectedGenres' && typeof saved[key]==='string')restored[key]=saved[key];
        }
      }
    } catch { /* A broken draft must never prevent editing a profile. */ }
    setBaseline(current);setForm({...current,...restored});setError('');setSuccess('');setInitializedKey(draftKey);
  },[user,draftKey,initializedKey]);

  useEffect(()=>{
    if(!draftKey || initializedKey!==draftKey || saving)return;
    try {
      if(hasChanges)localStorage.setItem(draftKey,JSON.stringify({...form,updatedAt:Date.now()}));
      else localStorage.removeItem(draftKey);
      setDraftSaved(hasChanges);
    } catch {setDraftSaved(false);}
  },[form,hasChanges,draftKey,initializedKey,saving]);

  const genres=useMemo(()=>[...new Set([...AVAILABLE_GENRES,...form.selectedGenres])],[form.selectedGenres]);
  const change=(key,value)=>{setForm(previous=>({...previous,[key]:value}));setSuccess('');setError('');};
  const toggleGenre=genre=>change('selectedGenres',form.selectedGenres.includes(genre)?form.selectedGenres.filter(item=>item!==genre):[...form.selectedGenres,genre]);
  const addGenre=()=>{
    const genre=customGenre.trim();
    if(genre && !form.selectedGenres.some(item=>item.toLocaleLowerCase()===genre.toLocaleLowerCase()))change('selectedGenres',[...form.selectedGenres,genre]);
    setCustomGenre('');
  };
  const reset=()=>{
    if(!window.confirm('¿Quieres descartar los cambios no guardados y restaurar tu información actual?'))return;
    const current=userFields(user);setBaseline(current);setForm(current);setCustomGenre('');setError('');setSuccess('');
    try {localStorage.removeItem(draftKey);} catch {}
  };
  const submit=async event=>{
    event.preventDefault();
    if(saving)return;
    if(!form.name.trim()){setError('Escribe el nombre o alias que quieres mostrar.');return;}
    setSaving(true);setError('');setSuccess('');
    const submitted={...form,name:form.name.trim(),avatar:form.avatar.trim(),bio:form.bio.trim(),favoriteArtist:form.favoriteArtist.trim(),favoriteAlbum:form.favoriteAlbum.trim(),spotifyUrl:form.spotifyUrl.trim(),instagramUrl:form.instagramUrl.trim()};
    try {
      const result=await updateProfile({name:submitted.name,avatar:submitted.avatar,avatar_url:submitted.avatar,bio:submitted.bio,favorite_artist:submitted.favoriteArtist,favorite_album:submitted.favoriteAlbum,favorite_genres:submitted.selectedGenres,spotify_url:submitted.spotifyUrl,instagram_url:submitted.instagramUrl});
      if(!result.success)throw new Error(result.error || 'No pudimos guardar los cambios. Inténtalo de nuevo.');
      setForm(submitted);setBaseline(submitted);setSuccess('Cambios guardados. Tu perfil está actualizado.');
      try {localStorage.removeItem(draftKey);} catch {}
    } catch(err){setError(err.message || 'No pudimos guardar los cambios. Tu borrador sigue aquí.');}
    finally {setSaving(false);}
  };

  if(!user) return <div className="account-page w-full max-w-7xl mx-auto space-y-6"><AppHeader showTitle={false}/><section className="account-access-state"><UiIcon name="settings" size={44}/><h1>Configuración de perfil</h1><p>{authLoading?'Cargando tu cuenta…':'Inicia sesión para personalizar tu perfil y tus gustos musicales.'}</p><Link className="account-primary-action" to="/">Ir a Musiclub<UiIcon name="arrow" tone="inherit"/></Link></section><Footer/></div>;
  if(initializedKey!==draftKey)return <div className="min-h-[70vh] flex items-center justify-center text-slate-300" role="status">Preparando tu perfil…</div>;
  return <div className="account-page w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12">
    <AppHeader showTitle={false}/>
    <header className="account-page-heading"><div><p className="account-eyebrow">Tu cuenta, a tu manera</p><h1>Configuración de perfil</h1><p>Una foto, tus favoritos y un poco de ti. Así te verá el club.</p></div><Link to="/profile" className="account-secondary-action"><UiIcon name="user" tone="inherit"/>Ver mi perfil</Link></header>
    <nav className="settings-section-links" aria-label="Secciones de Configuración"><a href="#settings-identity"><UiIcon name="user" tone="inherit"/>Identidad</a><a href="#settings-music"><UiIcon name="headphones" tone="inherit"/>Gustos musicales</a><a href="#settings-links"><UiIcon name="link" tone="inherit"/>Enlaces</a></nav>
    <form onSubmit={submit} className="settings-form">
      <div className="settings-layout">
        <fieldset disabled={saving} className="settings-fields">
          <AccountSection id="settings-identity" icon="user" title="Tu identidad" description="El nombre y la foto que acompañan tus reseñas." accent="pink">
            <div className="settings-avatar-row"><AccountAvatar src={form.avatar} name={form.name}/><div className="min-w-0 flex-1"><label htmlFor="settings-avatar">Foto de perfil</label><input id="settings-avatar" type="url" value={form.avatar} onChange={event=>change('avatar',event.target.value)} placeholder="https://ejemplo.com/tu-foto.jpg" aria-describedby="avatar-help"/><p id="avatar-help" className="settings-field-help">Enlace directo a una imagen JPG, PNG, GIF o WebP. Puedes dejarlo vacío para usar tu inicial.</p></div></div>
            <div className="settings-field-grid"><div><label htmlFor="settings-name">Nombre o alias</label><input id="settings-name" required autoComplete="nickname" value={form.name} onChange={event=>change('name',event.target.value)} placeholder="¿Cómo te conoce el club?"/></div><div><label htmlFor="settings-email">Correo de tu cuenta</label><input id="settings-email" type="email" value={user.email || ''} readOnly aria-describedby="email-help"/><p id="email-help" className="settings-field-help"><UiIcon name="lock" size={13} tone="inherit"/>Vinculado a tu inicio de sesión.</p></div></div>
            <div><label htmlFor="settings-bio">Acerca de ti</label><textarea id="settings-bio" rows={4} value={form.bio} onChange={event=>change('bio',event.target.value)} placeholder="Lo que escuchas, lo que buscas en un disco o lo que quieras compartir."/></div>
          </AccountSection>
          <AccountSection id="settings-music" icon="headphones" title="Tu identidad musical" description="Los favoritos y sonidos que te representan." accent="purple">
            <div className="settings-field-grid"><div><label htmlFor="settings-artist">Artista o banda favorita</label><input id="settings-artist" value={form.favoriteArtist} onChange={event=>change('favoriteArtist',event.target.value)} placeholder="Ese nombre que siempre vuelve"/></div><div><label htmlFor="settings-album">Álbum favorito</label><input id="settings-album" value={form.favoriteAlbum} onChange={event=>change('favoriteAlbum',event.target.value)} placeholder="El disco al que siempre regresas"/></div></div>
            <div><p id="settings-genres-label" className="settings-field-label">Tus géneros favoritos</p><div className="settings-genre-options" role="group" aria-labelledby="settings-genres-label">{genres.map(genre=><button key={genre} type="button" aria-pressed={form.selectedGenres.includes(genre)} onClick={()=>toggleGenre(genre)}><GenreLabel genre={genre} size={20}/>{form.selectedGenres.includes(genre)&&<UiIcon name="check" size={16} tone="inherit"/>}</button>)}</div></div>
            <div><label htmlFor="settings-custom-genre">¿Falta alguno?</label><div className="settings-add-genre"><input id="settings-custom-genre" value={customGenre} onChange={event=>setCustomGenre(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();addGenre();}}} placeholder="Escribe otro género"/><button type="button" className="account-secondary-action" onClick={addGenre} disabled={!customGenre.trim()}><UiIcon name="plus" tone="inherit"/>Agregar</button></div></div>
          </AccountSection>
          <AccountSection id="settings-links" icon="link" title="Donde también suenas" description="Comparte tus perfiles de música y redes." accent="cyan">
            <div><label htmlFor="settings-spotify"><SpotifyIcon className="w-4 h-4 text-[#1DB954]"/>Perfil de Spotify</label><input id="settings-spotify" type="url" value={form.spotifyUrl} onChange={event=>change('spotifyUrl',event.target.value)} placeholder="https://open.spotify.com/user/..."/></div>
            <div><label htmlFor="settings-instagram"><InstagramIcon className="w-4 h-4 text-pink-300"/>Perfil de Instagram</label><input id="settings-instagram" type="url" value={form.instagramUrl} onChange={event=>change('instagramUrl',event.target.value)} placeholder="https://www.instagram.com/tu_usuario/"/></div>
          </AccountSection>
        </fieldset>
        <aside className="settings-preview" aria-label="Vista previa de tu perfil">
          <div className="settings-preview-label"><UiIcon name="eye" tone="inherit"/>Vista previa</div>
          <div className="settings-preview-card"><AccountAvatar src={form.avatar} name={form.name}/><span className="profile-member-label">Miembro de Musiclub</span><h2 translate="no">{form.name.trim() || 'Tu nombre'}</h2><p className="settings-preview-bio">{form.bio.trim() || 'Tu historia musical empieza por aquí.'}</p><div className="settings-preview-favorites">{form.favoriteArtist&&<span><UiIcon name="mic" tone="inherit"/>{form.favoriteArtist}</span>}{form.favoriteAlbum&&<span><UiIcon name="disc" tone="inherit"/>{form.favoriteAlbum}</span>}</div><div className="settings-preview-genres">{form.selectedGenres.slice(0,5).map(genre=><GenreLabel key={genre} genre={genre} size={18}/>)}{form.selectedGenres.length>5&&<span>+{form.selectedGenres.length-5}</span>}</div></div>
          <p className="settings-preview-note">{draftSaved?<><UiIcon name="check" tone="inherit"/>Borrador guardado en este navegador.</>:<><UiIcon name="info" tone="inherit"/>Guarda los cambios para actualizar tu perfil.</>}</p>
        </aside>
      </div>
      <div className="settings-feedback" aria-live="polite">{error&&<p role="alert" className="settings-error"><UiIcon name="warning" tone="inherit"/>{error}</p>}{success&&<p role="status" className="settings-success"><UiIcon name="check" tone="inherit"/>{success}</p>}</div>
      <div className="settings-save-bar"><div><strong>{saving?'Guardando…':hasChanges?'Cambios sin guardar':'Tu perfil está al día'}</strong><span>{hasChanges?'Se publicarán al guardar.':'Puedes volver a editarlo cuando quieras.'}</span></div><div className="settings-save-actions"><button type="button" className="account-secondary-action" disabled={saving || !hasChanges} onClick={reset}><UiIcon name="repeat" tone="inherit"/>Revertir cambios</button><button type="submit" className="account-primary-action" disabled={saving || !hasChanges}><UiIcon name={saving?'hourglass':'save'} tone="inherit"/>{saving?'Guardando…':'Guardar cambios'}</button></div></div>
    </form>
    <Footer/>
  </div>;
}
