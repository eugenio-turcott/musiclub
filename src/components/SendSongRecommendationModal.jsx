'use client';
import {UiIcon} from './UiIcon';
import {createPortal} from 'react-dom';
import {useDialogFocus} from '../hooks/useDialogFocus';
import {SpotifyLogo,YouTubeMusicLogo,AppleMusicLogo,DeezerLogo} from './common/PlatformLogos';
import React, { useState, useEffect, useRef, useId } from 'react';
import { supabaseService } from '../services/supabaseClient';
import { searchTracks } from '../services/spotifyApi';
import { authenticatedFetch } from '../services/authenticatedFetch';
import { searchDeezerTrack } from '../services/deezerApi';
import { useAuth } from '../hooks/useAuth';
import { registerUntranslatableEntities } from '../utils/translateCrashGuard';

const VIBE_SUGGESTIONS = [
  '🎧 Escúchala con buenos audífonos',
  '🔥 Joyita oculta imperdible',
  '✨ Me recordó a tu estilo musical',
  '🎸 La producción y el solo son increíbles',
  '🌙 Perfecta para la noche',
  '☕ Mood relajante y reconfortante',
];

export function SendSongRecommendationModal({
  isOpen,
  onClose,
  currentUser,
  defaultRecipient = null,
  targetRecipient = null,
  onSuccess,
}) {
  const auth = useAuth();
  const effectiveUser=currentUser||auth?.user;
  const formId=useId();
  const dialogRef=useDialogFocus(isOpen,()=>{if(!submitting)handleClose();});

  const initialRecipient = defaultRecipient || targetRecipient || null;

  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // Form State
  const [selectedRecipient, setSelectedRecipient] = useState(initialRecipient);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [isRecipientDropdownOpen, setIsRecipientDropdownOpen] = useState(false);

  const [trackSearchQuery, setTrackSearchQuery] = useState('');
  const [spotifyResults, setSpotifyResults] = useState([]);
  const [isSearchingSpotify, setIsSearchingSpotify] = useState(false);
  const [showSpotifyResults, setShowSpotifyResults] = useState(false);
  const [isSongLocked, setIsSongLocked] = useState(false);

  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [albumName, setAlbumName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [appleMusicLink, setAppleMusicLink] = useState('');
  const [deezerLink, setDeezerLink] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const searchTimeoutRef = useRef(null);
  const searchSequence=useRef(0),closeTimer=useRef(null);
  useEffect(()=>()=>{searchSequence.current++;clearTimeout(searchTimeoutRef.current);clearTimeout(closeTimer.current);},[]);
  const dropdownRef = useRef(null);

  // Sincronizar destinatario recibido por props
  useEffect(() => {
    const target = defaultRecipient || targetRecipient;
    if (target) {
      setSelectedRecipient(target);
    }
  }, [defaultRecipient, targetRecipient]);

  // Cargar lista de miembros del club
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadMembers() {
      setLoadingProfiles(true);
      try {
        const data = await supabaseService.getAllProfiles();
        if (isMounted) {
          const currentEmail = (effectiveUser?.email || '').toLowerCase().trim();
          const currentId = effectiveUser?.id ? String(effectiveUser.id) : null;
          const filtered = (data || []).filter((p) => {
            const pEmail = (p.email || '').toLowerCase().trim();
            const pId = p.id ? String(p.id) : null;
            return (!currentEmail||!pEmail||pEmail!==currentEmail)&&(!currentId||pId!==currentId);
          });
          setProfiles(filtered);

          if (filtered.length > 0) {
            registerUntranslatableEntities({
              people: filtered.map((p) => p.name).filter(Boolean),
              artists: filtered.map((p) => p.favorite_artist).filter(Boolean),
            });
          }

          const target = defaultRecipient || targetRecipient;
          if (target) {
            const matched = filtered.find(
              (p) =>
                (target.email && p.email?.toLowerCase().trim() === target.email?.toLowerCase().trim()) ||
                (target.id && String(p.id) === String(target.id)) ||
                (target.name && p.name?.toLowerCase().trim() === target.name?.toLowerCase().trim())
            );
            setSelectedRecipient(matched || target);
          }
        }
      } catch (err) {
        console.warn('Error cargando perfiles:', err);
      } finally {
        if (isMounted) setLoadingProfiles(false);
      }
    }

    loadMembers();
    return () => {
      isMounted = false;
    };
  }, [isOpen,effectiveUser?.id,effectiveUser?.email,defaultRecipient?.id,targetRecipient?.id]);

  // Búsqueda en Spotify con debounce
  const handleSpotifySearchChange = (e) => {
    if (isSongLocked) return;
    const val = e.target.value;
    const request=++searchSequence.current;
    setTrackSearchQuery(val);
    setShowSpotifyResults(true);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!val || val.trim().length < 2) {
      setSpotifyResults([]);
      setIsSearchingSpotify(false);
      return;
    }

    setIsSearchingSpotify(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await searchTracks(val, 8);
        if(request!==searchSequence.current)return;
        if (res && res.success && res.tracks) {
          setSpotifyResults(res.tracks);
        } else {
          setSpotifyResults([]);
        }
      } catch (err) {
        console.warn('Error buscando tracks:', err);
        if(request===searchSequence.current)setSpotifyResults([]);
      } finally {
        if(request===searchSequence.current)setIsSearchingSpotify(false);
      }
    }, 350);
  };

  // Seleccionar track de Spotify y autocompletar todas las plataformas
  const handleSelectTrack = (track) => {
    const selectedRequest=++searchSequence.current;clearTimeout(searchTimeoutRef.current);setIsSearchingSpotify(false);
    const rawArtist = track.artistName || (track.artists && track.artists.join(', ')) || '';
    const cleanTrackTitle = track.name || '';

    setSongTitle(cleanTrackTitle);
    setArtistName(rawArtist);
    setAlbumName(track.albumName || '');
    setImageUrl(track.imageUrl || '');
    setSpotifyLink(track.spotifyUrl || '');

    // Bloquear campo de búsqueda y mostrar canción seleccionada con tachita
    setTrackSearchQuery(`${cleanTrackTitle} - ${rawArtist}`);
    setIsSongLocked(true);
    setShowSpotifyResults(false);
    setSpotifyResults([]);

    // 1. YouTube Music
    const ytQuery = encodeURIComponent(`${rawArtist} ${cleanTrackTitle}`.trim());
    setYoutubeLink(`https://music.youtube.com/search?q=${ytQuery}`);

    // 2. Apple Music
    const amQuery = encodeURIComponent(`${rawArtist} ${cleanTrackTitle}`.trim());
    setAppleMusicLink(`https://music.apple.com/search?term=${amQuery}`);

    // 3. Deezer (búsqueda directa inicial + resolución exacta asíncrona)
    const dzQuery = encodeURIComponent(`${rawArtist} ${cleanTrackTitle}`.trim());
    setDeezerLink(`https://www.deezer.com/search/${dzQuery}`);
    searchDeezerTrack(rawArtist, cleanTrackTitle).then((exactLink) => {
      if (exactLink&&selectedRequest===searchSequence.current) setDeezerLink(exactLink);
    });

    // Blindaje de traducción
    registerUntranslatableEntities({
      releases: [track.name, track.albumName].filter(Boolean),
      artists: [rawArtist, ...(track.artists || [])].filter(Boolean),
    });
  };

  // Eliminar selección de canción (Tachita ✕) y limpiar campos
  const handleClearSelectedTrack = () => {
    searchSequence.current++;clearTimeout(searchTimeoutRef.current);setIsSearchingSpotify(false);
    setIsSongLocked(false);
    setTrackSearchQuery('');
    setSpotifyResults([]);
    setShowSpotifyResults(false);
    setSongTitle('');
    setArtistName('');
    setAlbumName('');
    setImageUrl('');
    setSpotifyLink('');
    setYoutubeLink('');
    setAppleMusicLink('');
    setDeezerLink('');
  };

  // Reset del formulario al cerrar
  const handleClose = () => {
    searchSequence.current++;clearTimeout(searchTimeoutRef.current);clearTimeout(closeTimer.current);setIsSearchingSpotify(false);setRecipientSearch('');setIsRecipientDropdownOpen(false);
    setErrorMsg('');
    setSuccessMsg('');
    setIsSongLocked(false);
    setSongTitle('');
    setArtistName('');
    setAlbumName('');
    setImageUrl('');
    setSpotifyLink('');
    setYoutubeLink('');
    setAppleMusicLink('');
    setDeezerLink('');
    setMessage('');
    setTrackSearchQuery('');
    setSpotifyResults([]);
    setShowSpotifyResults(false);
    setSelectedRecipient(null);
    onClose();
  };

  // Enviar recomendación
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedRecipient) {
      setErrorMsg('Por favor selecciona el miembro del club al que deseas enviar la recomendación.');
      return;
    }

    if (!songTitle.trim() || !artistName.trim()) {
      setErrorMsg('El título de la canción y el nombre del artista son obligatorios.');
      return;
    }

    if (!effectiveUser || !effectiveUser.email) {
      setErrorMsg('Debes iniciar sesión para enviar una recomendación.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        senderId: effectiveUser.id || null,
        senderName: effectiveUser.name || effectiveUser.email?.split('@')[0] || 'Miembro de Musiclub',
        senderEmail: effectiveUser.email,
        recipientId: selectedRecipient.id || null,
        recipientName: selectedRecipient.name || selectedRecipient.email?.split('@')[0] || 'Compañero',
        recipientEmail: selectedRecipient.email,
        songTitle: songTitle.trim(),
        artistName: artistName.trim(),
        albumName: albumName.trim() || null,
        imageUrl: imageUrl.trim() || null,
        spotifyLink: spotifyLink.trim() || null,
        youtubeLink: youtubeLink.trim() || null,
        appleMusicLink: appleMusicLink.trim() || null,
        deezerLink: deezerLink.trim() || null,
        otherLink: deezerLink.trim() || null,
        message: message.trim() || null,
        lang:
          typeof window !== 'undefined'
            ? localStorage.getItem('musiclub_selected_lang') ||
              (navigator.language && navigator.language.startsWith('en') ? 'en' : 'es')
            : 'es',
      };

      // 1. Guardar en base de datos Supabase
      const savedRecommendation = await supabaseService.sendSongRecommendation(payload);

      // 2. Despachar correo de notificación transaccional al destinatario
      let mailConfirmed=false;
      try {
        const delivery=await authenticatedFetch('/api/notifications/recommendation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recommendationId: savedRecommendation?.id }),
        });
        const result=await delivery.json().catch(()=>({}));
        mailConfirmed=delivery.ok&&result.success===true&&!result.isTest;
      } catch (mailErr) {
        console.warn('Aviso notificando correo de recomendación:', mailErr);
      }

      setSuccessMsg(mailConfirmed?'Recomendación guardada y correo enviado.':'Recomendación guardada. No se confirmó el envío del correo.');
      closeTimer.current=setTimeout(() => {
        if (onSuccess) onSuccess();
        handleClose();
      }, 2600);
    } catch (err) {
      console.error('Error enviando recomendación:', err);
      setErrorMsg(err.message || 'Ocurrió un error al enviar la recomendación.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filtrar miembros en el buscador de destinatario
  const filteredProfiles = profiles.filter((p) => {
    if (!recipientSearch.trim()) return true;
    const term = recipientSearch.toLowerCase();
    const name = (p.name || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const favArtist = (p.favorite_artist || '').toLowerCase();
    return name.includes(term) || email.includes(term) || favArtist.includes(term);
  });

  const field=(id,label,value,setter,type='text')=><label className="song-field" htmlFor={formId+'-'+id}><span>{label}</span><input id={formId+'-'+id} type={type} value={value} onChange={e=>setter(e.target.value)} disabled={submitting}/></label>;
  const platforms=[['spotify','Spotify',SpotifyLogo,spotifyLink,setSpotifyLink,'#45da89'],['youtube','YouTube Music',YouTubeMusicLogo,youtubeLink,setYoutubeLink,'#ff717b'],['apple','Apple Music',AppleMusicLogo,appleMusicLink,setAppleMusicLink,'#ffa0cb'],['deezer','Deezer',DeezerLogo,deezerLink,setDeezerLink,'#c6a2ff']];
  return createPortal(<div className="song-compose-overlay" onClick={e=>{if(e.target===e.currentTarget&&!submitting)handleClose();}}><section className="song-compose" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={formId+'-title'}>
    <header className="song-compose-header"><span className="song-compose-stamp"><UiIcon name="mailbox" tone="inherit" size={32}/></span><div><span className="account-eyebrow">BUZÓN MUSICAL</span><h2 id={formId+'-title'}>Recomendar una canción</h2><p>Elige a alguien, añade una canción y escribe tu dedicatoria.</p></div><button type="button" aria-label="Cerrar recomendación" onClick={handleClose} disabled={submitting}><UiIcon name="close" tone="inherit"/></button></header>
    <form onSubmit={handleSubmit} className="song-compose-form">
      {errorMsg&&<p className="song-compose-error" role="alert"><UiIcon name="help" tone="inherit"/>{errorMsg}</p>}{successMsg&&<p className="song-compose-success" role="status"><UiIcon name="check" tone="inherit"/>{successMsg}</p>}
      <fieldset disabled={submitting||Boolean(successMsg)}><legend><UiIcon name="user" tone="inherit"/>Destinatario</legend><div ref={dropdownRef}>
        {selectedRecipient?<div className="song-recipient-selected">{selectedRecipient.avatar_url?<img src={selectedRecipient.avatar_url} alt=""/>:<span className="song-person-initial">{(selectedRecipient.name||'M')[0]}</span>}<span><strong>{selectedRecipient.name||'Miembro del club'}</strong><small>{selectedRecipient.favorite_artist?'Fan de '+selectedRecipient.favorite_artist:'Miembro de Musiclub'}</small></span><button type="button" onClick={()=>{setSelectedRecipient(null);setIsRecipientDropdownOpen(true);}}>Cambiar</button></div>:<><label className="song-search"><UiIcon name="search" tone="inherit"/><input aria-label="Buscar miembro" placeholder="Buscar por nombre o artista favorito" value={recipientSearch} onChange={e=>{setRecipientSearch(e.target.value);setIsRecipientDropdownOpen(true);}} onFocus={()=>setIsRecipientDropdownOpen(true)}/></label>{isRecipientDropdownOpen&&<div className="song-recipient-results" aria-label="Miembros disponibles">{loadingProfiles?<p role="status">Cargando miembros…</p>:filteredProfiles.length?filteredProfiles.map(p=><button type="button" key={p.id} onClick={()=>{setSelectedRecipient(p);setRecipientSearch('');setIsRecipientDropdownOpen(false);}}>{p.avatar_url?<img src={p.avatar_url} alt=""/>:<span className="song-person-initial">{(p.name||'M')[0]}</span>}<span><strong>{p.name||'Miembro'}</strong><small>{p.favorite_artist||'Miembro de Musiclub'}</small></span><UiIcon name="arrow" tone="inherit"/></button>):<p>No se encontraron miembros.</p>}</div>}</>}
      </div></fieldset>
      <fieldset disabled={submitting||Boolean(successMsg)}><legend><UiIcon name="notes" tone="inherit"/>Canción</legend><label className="song-search song-search-spotify"><SpotifyLogo/><input aria-label="Buscar canción en Spotify" placeholder="Buscar canción o artista en Spotify" value={trackSearchQuery} onChange={handleSpotifySearchChange} readOnly={isSongLocked}/>{isSongLocked&&<button type="button" aria-label="Cambiar canción seleccionada" onClick={handleClearSelectedTrack}><UiIcon name="close" tone="inherit"/></button>}</label>
        {showSpotifyResults&&<div className="song-search-results">{isSearchingSpotify?<p role="status">Buscando canciones…</p>:spotifyResults.length?spotifyResults.map(track=><button type="button" key={track.id||track.spotifyUrl} onClick={()=>handleSelectTrack(track)}>{track.imageUrl&&<img src={track.imageUrl} alt=""/>}<span><strong>{track.name}</strong><small>{track.artistName||(track.artists||[]).join(', ')}</small></span><UiIcon name="plus" tone="inherit"/></button>):trackSearchQuery.length>=2?<p>No encontramos coincidencias. Puedes completar los datos abajo.</p>:null}</div>}
        <div className="song-manual-fields">{field('song','Título de la canción *',songTitle,setSongTitle)}{field('artist','Artista *',artistName,setArtistName)}{field('album','Álbum (opcional)',albumName,setAlbumName)}{field('cover','Imagen (opcional)',imageUrl,setImageUrl,'url')}</div>
      </fieldset>
      <fieldset disabled={submitting||Boolean(successMsg)}><legend><UiIcon name="link" tone="inherit"/>Enlaces de escucha <small>Opcionales</small></legend><div className="song-platform-fields">{platforms.map(([id,label,Logo,value,setValue,color])=><label key={id} htmlFor={formId+'-'+id} style={{'--platform-color':color}}><span><Logo/>{label}</span><input id={formId+'-'+id} type="url" placeholder="https://…" value={value} onChange={e=>setValue(e.target.value)}/></label>)}</div></fieldset>
      <fieldset disabled={submitting||Boolean(successMsg)}><legend><UiIcon name="pen" tone="inherit"/>Tu dedicatoria <small>{message.length}/300</small></legend><textarea aria-label="Dedicatoria" value={message} maxLength={300} onChange={e=>setMessage(e.target.value)} placeholder="Qué te recordó a esta persona o por qué debería escucharla…" rows={3}/><div className="song-message-prompts">{[['headphones','Escúchala con buenos audífonos'],['diamond','Un descubrimiento para ti'],['moon-stars','Para escuchar por la noche']].map(([icon,label])=><button type="button" key={icon} onClick={()=>setMessage(m=>(m+(m?'\n':'')+label).slice(0,300))}><UiIcon name={icon} tone="inherit"/>{label}</button>)}</div></fieldset>
      {songTitle&&<aside className="song-compose-preview" aria-label="Vista previa de la recomendación">{imageUrl?<img src={imageUrl} alt="Portada de la canción" onError={e=>{e.currentTarget.style.display='none';}}/>:<UiIcon name="disc" tone="inherit" size={48}/>}<div><span>PARA {selectedRecipient?.name||'ALGUIEN DEL CLUB'}</span><strong>{songTitle}</strong><p>{artistName}{albumName?' · '+albumName:''}</p>{message&&<blockquote>{message}</blockquote>}</div></aside>}
      <footer className="song-compose-footer"><p><UiIcon name="shield" tone="inherit"/>Se guarda en su Buzón. Intentaremos avisarle por correo.</p><div><button type="button" onClick={handleClose} disabled={submitting}>Cancelar</button><button type="submit" className="account-primary-action" disabled={submitting||Boolean(successMsg)||!songTitle.trim()||!artistName.trim()||!selectedRecipient}><UiIcon name={submitting?'clock':'send'} tone="inherit"/>{submitting?'Enviando…':'Enviar recomendación'}</button></div></footer>
    </form>
  </section></div>,document.body);
}
export default SendSongRecommendationModal;
