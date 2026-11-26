'use client';
import {useState} from 'react';
import Link from 'next/link';
import {UiIcon} from './UiIcon';
import {GenreArtwork} from './GenreArtwork';
import {CoverImage} from './CoverImage';
import {SpotifyLogo,AppleMusicLogo,YouTubeMusicLogo,DeezerLogo} from './common/PlatformLogos';
import {getReleaseUrl} from '../utils/ratingUtils';
import {GRAMMY_FIELDS} from '../data/grammys2027.mjs';
import {grammyRewardFor} from '../utils/grammyRewards.mjs';
import {grammyNomineeReviewed,grammyListeningFallback} from '../utils/grammyListening.mjs';
import styles from './GrammyCategory.module.css';

export function GrammyCategoryArt({category,field=false}){
  const size=field?44:88;
  return category.genre
    ? <GenreArtwork genre={category.genre} size={size} animated className={styles.vinyl}/>
    : <span data-grammy-vinyl={category.icon} className={styles.customVinyl} style={{'--disc-size':`${size}px`}}><GenreArtwork edition="miel-translucida" size={size} animated className={styles.customDisc}/><UiIcon name={category.icon} tone="accent" className={styles.customGlyph}/></span>;
}

const platforms=[['spotify_url',SpotifyLogo,'Spotify','spotify'],['apple_music_url',AppleMusicLogo,'Apple Music','apple'],['youtube_url',YouTubeMusicLogo,'YouTube Music','youtube'],['deezer_url',DeezerLogo,'Deezer','deezer']];

export function GrammyCategory({category,nominees,choice,selected,onChoose,onSave,open,busy,reviews,award,before}){
  const [feedback,setFeedback]=useState(''),[failed,setFailed]=useState(false),[submitting,setSubmitting]=useState(false);
  const titleId=`grammy-category-${category.id}`,dirty=choice!==selected;
  async function submit(value){
    setFeedback('');setFailed(false);setSubmitting(true);
    const ok=await onSave(category.id,value);
    setSubmitting(false);
    setFailed(!ok);setFeedback(ok?(value?'Predicción guardada.':'Predicción eliminada.'):'No se pudo guardar. Reintenta cuando tu sesión esté disponible.');
  }
  return <section className={styles.section} aria-labelledby={titleId} data-grammy-category={category.id}>
    <header className={styles.header}>
      <GrammyCategoryArt category={category}/>
      <div className={styles.heading}>
        <span className={styles.kicker}>CATEGORÍA {String(category.order).padStart(2,'0')} · {GRAMMY_FIELDS.find(f=>f.id===category.field)?.title}</span>
        <h3 id={titleId}>{category.name}</h3><p>{category.english}</p>
        <div className={styles.tags}><span><UiIcon name="gramophone"/>+{grammyRewardFor(category)} XP por acierto</span>{category.isNew&&<span className={styles.newTag}><UiIcon name="sparkles"/>Nueva en 2027</span>}<span>{nominees.length} {nominees.length===1?'nominado':'nominados'}</span></div>
      </div>
      {selected&&<span className={styles.saved}><UiIcon name="check"/>{award?`Acierto · +${award.xp} XP`:'Predicción guardada'}</span>}
    </header>
    {nominees.length?<>
      <fieldset className={styles.nominees} disabled={busy||!open}>
        <legend className={styles.srOnly}>Tu predicción para {category.name}</legend>
        {nominees.map(n=>{
          const reviewed=grammyNomineeReviewed(n,category,reviews),picked=choice===n.id;
          return <article key={n.id} className={styles.card} data-selected={picked} data-reviewed={reviewed}>
            <label className={styles.nomineeLabel}>
              <input type="radio" name={`grammy-${category.id}`} checked={picked} onChange={()=>{onChoose(n.id);setFeedback('');setFailed(false);}}/>
              <span className={styles.cover}>{n.image_url?<CoverImage src={n.image_url} alt="" sizes="(max-width: 620px) 44vw, (max-width: 1100px) 28vw, 260px"/>:<GrammyCategoryArt category={category}/>}</span>
              <strong>{n.title}</strong>{category.kind!=='person'&&n.artist&&<span className={styles.artist}>{n.artist}</span>}
            </label>
            <div className={styles.cardBottom}>
              <div className={styles.cardStatus}>{reviewed&&<span className={styles.reviewed}><UiIcon name="check"/>Ya reseñaste este release</span>}{picked&&<span className={styles.chosen}><UiIcon name={n.id===selected?'check':'star'}/>{n.id===selected?'Tu predicción':'Tu selección'}</span>}</div>
              <div className={styles.platforms}>{platforms.filter(([key])=>n[key]).map(([key,Logo,name,platform])=><a key={key} data-platform={platform} href={n[key]} target="_blank" rel="noopener noreferrer" aria-label={`Escuchar ${n.title} en ${name}`} title={name}><Logo/></a>)}</div>
              {category.kind!=='person'&&<Link className={styles.releaseLink} href={n.albums?getReleaseUrl(n.albums):grammyListeningFallback(n,category)} prefetch={false}>Escuchar y calificar <UiIcon name="arrow"/></Link>}
            </div>
          </article>;
        })}
      </fieldset>
      <footer className={styles.actions}>
        {open?<><button className={styles.save} type="button" aria-label={`Guardar predicción de ${category.name}`} disabled={busy||submitting||!choice||!dirty} onClick={()=>submit(choice)}><UiIcon name={submitting?'clock':'check'}/>{submitting?'Guardando…':'Guardar predicción'}</button>{selected&&<button className={styles.remove} type="button" disabled={busy||submitting} aria-label={`Quitar predicción de ${category.name}`} onClick={()=>submit(null)}><UiIcon name="close"/>Quitar predicción</button>}{dirty&&<button className={styles.discard} type="button" disabled={busy||submitting} onClick={()=>{onChoose(selected);setFeedback('');}}>Descartar cambio</button>}<small>{dirty?'Tienes una selección sin guardar.':'Puedes cambiar tu predicción antes del cierre.'}</small></>:<p className={styles.closed}><UiIcon name="lock"/>Las predicciones están cerradas. Puedes seguir escuchando a los nominados.</p>}
      </footer>
      {feedback&&<p className={styles.feedback} role={failed?'alert':'status'}>{feedback}</p>}
    </>:<div className={styles.waiting}><UiIcon name="calendar"/><div><h4>{before?'Nominados por anunciar':'Nominados pendientes de verificar'}</h4><p>{before?'El 16 de noviembre conoceremos los nombres oficiales. Aquí podrás escucharlos, calificarlos y predecir.':'Esta categoría todavía no tiene nominados publicados. Puedes explorar las demás.'}</p></div></div>}
  </section>;
}
